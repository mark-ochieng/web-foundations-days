SnapShare Scaling Plan
1. Assumptions
Registered users: 10,000,000
Daily active users (10%): 10,000,000 x 0.10 = 1,000,000 DAU
Each active user uploads 1 photo per day
Each active user views 50 feed pages per day
Average original photo: 2 MB; each photo also gets a 50 KB thumbnail (2.05 MB stored per photo)
1 day = 86,400 seconds; peak traffic = 5x the average
Decimal units are used (1 TB = 1,000,000 MB)
2. Estimates
Uploads per second
Uploads per day: 1,000,000 x 1 = 1,000,000
Average: 1,000,000 / 86,400 = about 11.6 uploads/s
Peak (5x): about 58 uploads/s
Feed views per second
Feed views per day: 1,000,000 x 50 = 50,000,000
Average: 50,000,000 / 86,400 = about 579 views/s
Peak (5x): about 2,900 views/s
Photo storage per year
Originals per day: 1,000,000 x 2 MB = 2 TB
Thumbnails per day: 1,000,000 x 50 KB = 0.05 TB
Total per day: 2.05 TB
Per year: 2.05 TB x 365 = about 748 TB (roughly 0.75 PB)
Originals: about 730 TB
Thumbnails: about 18 TB
Storage estimate note: These figures represent logical storage for new original photos and thumbnails only. Actual infrastructure capacity and cost will be higher after accounting for database metadata, backups, replication, retention policies, and storage overhead. If photos are not deleted, the total stored data will continue growing each year.
3. Read-heavy or write-heavy?
The system is read-heavy. There are 50 million feed views per day against 1 million uploads per day, a ratio of about 50 reads to 1 write. Peak reads (about 2,900/s) are around 50 times peak writes (about 58/s).
What this means for the design:
Optimise for fast reads: cache feed data, serve images from a CDN, and send read queries to a read replica so the primary database is left to handle writes.
Writes can be processed asynchronously where appropriate. A user should receive a quick upload response, while thumbnail generation can happen in the background.
Scale the read side horizontally (more app servers, more cache capacity, and more replicas) because that is where the load is.
4. Why photos are not stored in the database
A 2 MB photo stored as a database blob makes rows huge, increases backup and replication overhead, slows queries, and uses database storage for data that grows quickly. At about 748 TB of new photo data per year, storing the images in the database would be difficult and expensive to manage. A database is also not the best place to serve large files directly to thousands of users.
Instead, photos go in object storage (such as Amazon S3 or Google Cloud Storage), which is designed for large amounts of durable file storage. The database stores a small record per photo: photo ID, owner ID, object storage key, caption, timestamp, and processing status. The CDN then serves the image files to users.
5. Architecture diagram
                          +----------+
                          |  Users   |
                          | (mobile) |
                          +----+-----+
                               |
             +-----------------+-----------------+
             | (photo files)                     | (API requests)
             v                                   v
       +-----------+                     +---------------+
       |    CDN    |                     | Load Balancer |
       +-----+-----+                     +-------+-------+
             | (cache miss)                      |
             v                         +---------+---------+
    +------------------+               v                   v
    |  Object Storage  |         +-----------+       +-----------+
    |  (photos +       |<--------| App Server|  ...  | App Server|
    |   thumbnails)    |  upload +-----+-----+       +-----+-----+
    +--------+---------+               |                   |
             ^                         +---------+---------+
             |                                   |
             |                    +--------------+--------------+
             |                    |              |              |
             |                    v              v              v
             |              +-----------+  +------------+  +-----------+
             |              |   Cache   |  |  Database  |  |   Queue   |
             |              |  (Redis)  |  |  (primary) |  |           |
             |              +-----------+  +-----+------+  +-----+-----+
             |                                   |               |
             |                                   v               v
             |                            +------------+   +-----------+
             |                            | Read       |   | Thumbnail |
             |                            | Replica    |   | Worker    |
             |                            +------------+   +-----+-----+
             |                                                   |
             +---------------------------------------------------+
                       (worker reads original, writes thumbnail)
Feed retrieval flow
When a user opens their feed, the application server checks Redis for cached feed data first. If the data is not cached, it queries the database read replica. The client retrieves the associated images through the CDN, which fetches uncached images from object storage.
Horizontal scaling
Horizontal scaling means adding more application server instances to handle increasing traffic. The load balancer distributes requests across these instances, allowing the application to support more concurrent users without depending on a single server.
6. Components, one sentence each
CDN: Serves photos from locations close to users so images load quickly and origin storage is not accessed for every view.
Load balancer: Distributes incoming API requests across multiple application servers so no single server is overloaded and a server failure does not take down the entire application.
App servers: Run application logic such as login, feed building, and upload handling, and can be added or removed as traffic changes.
Cache: Keeps frequently requested data, such as feed pages and photo metadata, in memory so repeated reads can avoid database queries.
Database (primary): Reliably stores users, follows, and photo metadata, and receives database writes.
Read replica: Holds a copy of the primary database and handles read queries, reducing load on the primary.
Object storage: Stores original photos and thumbnails durably and cost-effectively at large scale.
Queue: Holds thumbnail-processing jobs so uploads can complete quickly and jobs can wait safely when workers are busy or temporarily unavailable.
Thumbnail worker: Takes jobs from the queue and creates the thumbnail in the background.
7. Upload flow, step by step
The user selects a photo in the app and taps Upload.
The upload request reaches an application server through the load balancer.
The application server verifies that the user is authenticated and authorized to upload, checks the user's quota, and validates that the file is an allowed image type within the size limit.
The application server saves the original photo to object storage and receives a storage key.
The application server writes a photo record (photo ID, owner ID, storage key, timestamp, and status processing) to the primary database.
The application server adds a thumbnail-generation job to the queue and returns a successful upload response to the user.
A thumbnail worker takes the job from the queue, downloads the original from object storage, and resizes it to a target of about 50 KB.
The worker saves the thumbnail to object storage and updates the photo record to status ready.
The system clears or refreshes relevant cache entries so followers can see the new photo in their feeds. The CDN serves the thumbnail when requested.
Reliability note: Thumbnail jobs should support retries for temporary failures. Failed jobs should be logged and monitored, and persistent failures should be moved to a dead-letter queue for investigation. This prevents temporary worker problems from permanently blocking thumbnail generation.
8. Optional future optimization: direct uploads
For higher traffic, SnapShare could use pre-signed upload URLs:
The user's app requests permission to upload a photo.
The application server authenticates and authorizes the user, then generates a short-lived URL limited to the intended upload.
The user's device uploads the photo directly to object storage, reducing large-file traffic through the application servers.
The application records the photo metadata and queues thumbnail generation.
This can reduce application-server bandwidth and processing overhead. The upload URL should be short-lived and restricted to the intended object and permitted operation.
9. Trade-offs
Caching improves speed but can return stale data. A cached feed may not include a photo uploaded seconds ago. A short delay is acceptable for many feed views, but the application needs a strategy for refreshing or invalidating cache entries.
Read replicas add read capacity but may lag behind the primary. A user might upload a photo and not see it immediately if the feed reads from a replica. The application can read from the primary for a user's own recent actions when immediate visibility is important.
Asynchronous thumbnail generation keeps uploads fast but adds complexity. The user receives a quick response, but the thumbnail may appear later. Queues and workers must be monitored, and failed jobs need retry handling.
A CDN and object storage reduce origin load but still have costs. CDN bandwidth is billed, and deleted or replaced photos may remain cached until the cache expires or is invalidated.
Pre-signed direct uploads reduce application-server load but require careful authorization. URLs must be short-lived and restricted so users cannot overwrite or upload files outside their permissions.