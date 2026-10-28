TicketHub: Event Ticketing System Design

1. Requirements

1.1 Functional Requirements

The TicketHub system must allow users to:

1. Register, log in, and manage their accounts.
2. Browse upcoming concerts and events.
3. View event details, including the venue, date, price, and available seats.
4. View a seat map showing available, held, and sold seats.
5. Select and temporarily hold available seats before purchasing them.
6. Pay for held seats using a payment provider.
7. Receive a booking confirmation and ticket after successful payment.
8. View their purchased tickets and order history.
9. Cancel eligible orders and receive refunds according to the event's cancellation policy.
10. Receive notifications when a booking succeeds or fails.

1.2 Non-Functional Requirements

Performance

- Event listings and event details should normally load within 2 seconds.
- Seat availability and seat-hold requests should normally respond within 2 seconds under expected load.
- The system must handle at least 333 purchase attempts per second during a major sale, with additional capacity for browsing and retries.

Correctness and consistency

- A seat must never be sold to more than one customer.
- Only available seats can be held.
- A hold must expire after a fixed period, such as 5 minutes, unless extended under an explicitly defined policy.
- An order must not be marked as paid until the payment provider confirms successful payment.
- Retried payment and booking requests must not create duplicate orders or charges.

Fairness

- Users should be processed through a queue or waiting room during major sales.
- The waiting room should assign users a fair, controlled opportunity to access the sale rather than allowing unlimited rapid requests.
- Each user should be subject to purchase limits to discourage scalping.
- Users should receive clear information about their queue position, seat availability, and hold expiration.
- The system should not promise a seat until the database confirms that the seat has been held successfully.

Availability and reliability

- The service should remain available during traffic spikes.
- Failed application instances should be replaceable without losing confirmed orders.
- Payment notifications should be retried safely if delivery fails.
- Database backups and recovery procedures should protect order records.

Security

- Passwords must be securely hashed.
- All client-server communication must use HTTPS.
- Users must only access their own orders and tickets.
- Payment details should be handled by a trusted payment provider rather than stored directly by TicketHub.
- Rate limiting and monitoring should help prevent abuse.

2. Traffic and Capacity Estimates

2.1 Normal-Day Traffic

Given:

- Registered users: 2,000,000.
- Daily visitors: 50,000.
- Pages viewed per visitor: 10.
- Tickets sold per day: 5,000.

Daily page views

50,000 visitors × 10 pages = 500,000 page views per day.

Average page requests per second

500,000 ÷ 86,400 seconds = approximately 5.8 page requests per second.

If most traffic occurs during a 10-hour active period:

500,000 ÷ 36,000 seconds = approximately 13.9 page requests per second.

Average ticket sales per second

5,000 ÷ 86,400 = approximately 0.058 tickets per second.

This is an average of about 208 tickets per hour across the entire day.

These are average estimates. Actual traffic will vary throughout the day.

2.2 Popular Concert Sale

Given:

- People trying to buy tickets: 200,000.
- Available seats: 20,000.
- Sale window: 10 minutes.

Incoming purchase attempts per second

200,000 ÷ 600 seconds = approximately 333 purchase attempts per second.

Maximum average successful seat sales per second

20,000 ÷ 600 seconds = approximately 33.3 seats per second if all seats sell within the first 10 minutes.

Demand compared with supply

200,000 people ÷ 20,000 seats = 10 people per seat.

Only 10% of the people attempting to buy can obtain a seat if each person buys one seat and all seats sell.

The system must therefore reject or queue unsuccessful attempts without selling the same seat twice.

The 333 attempts per second estimate represents the average arrival rate across the 10-minute window. Real traffic may be much higher during the first few seconds. The design should accommodate bursts above this average.

2.3 Comparison

Metric| Normal Day| Popular Concert Sale
Visitors or interested buyers| 50,000 per day| 200,000 in 10 minutes
Page views| 500,000 per day| Potentially much higher during the sale
Average page requests per second| 5.8 over 24 hours| Depends on browsing behavior
Purchase attempts| 5,000 daily ticket sales| About 333 attempts per second
Ticket inventory| Varies by event| 20,000 seats
Main challenge| Efficient everyday operation| Sudden traffic, fairness, and seat contention

The major sale concentrates demand into a short period. A waiting room, caching, horizontal scaling, rate limiting, and database-level seat protection are needed to manage this demand safely.

3. API Design

The API will use REST principles and JSON responses. All protected endpoints require authentication.

Endpoint 1: Browse Events

GET /api/events

Returns a paginated list of upcoming events.

Example query:

"GET /api/events?page=1&limit=20"

Example response:

{
  "events": [
    {
      "id": 101,
      "name": "Summer Music Festival",
      "date": "2027-01-15",
      "venue": "City Arena",
      "startingPrice": 2500
    }
  ],
  "page": 1,
  "totalPages": 5
}

Endpoint 2: View Event Details and Seats

GET /api/events/{eventId}/seats

Returns the seats for an event and their current availability.

Example response:

{
  "eventId": 101,
  "seats": [
    {
      "id": 501,
      "label": "A1",
      "status": "available",
      "price": 2500
    },
    {
      "id": 502,
      "label": "A2",
      "status": "held",
      "price": 2500
    }
  ]
}

Seat availability can change immediately after the response. The system must verify availability again when a user requests a hold.

Endpoint 3: Hold Seats

POST /api/events/{eventId}/holds

Creates a temporary hold on selected seats if they are available.

Example request:

{
  "seatIds": [501, 502]
}

Example successful response:

{
  "holdId": "hold_789",
  "seatIds": [501, 502],
  "expiresAt": "2027-01-15T10:05:00Z"
}

If another customer has already held or purchased a requested seat, the request must fail for that seat. The database must perform the final availability check atomically.

Endpoint 4: Pay for an Order

POST /api/orders/{orderId}/payments

Initiates payment for an order associated with a valid seat hold.

Example request:

{
  "paymentMethodToken": "provider_token_123"
}

Example response:

{
  "orderId": 9001,
  "status": "payment_pending"
}

The payment provider processes the transaction. A verified payment callback or webhook updates the order to "paid" and the seats to "sold".

The request must use an idempotency key so that retries do not create duplicate payments.

Endpoint 5: View My Tickets

GET /api/me/tickets

Returns tickets belonging to the authenticated user.

Example response:

{
  "tickets": [
    {
      "ticketId": 7001,
      "eventId": 101,
      "eventName": "Summer Music Festival",
      "seatLabel": "A1",
      "status": "confirmed"
    }
  ]
}

Endpoint 6: View My Orders

GET /api/me/orders

Returns the authenticated user's order history and payment statuses.

Endpoint 7: Release or Cancel a Hold

DELETE /api/holds/{holdId}

Releases an active hold when the customer cancels the booking process. Expired holds are also released automatically, provided they have not been purchased.

4. Data Model

The system uses a relational database because seat ownership, orders, and payments require strong consistency.

4.1 Users

Stores customer account information.

Column| Type| Purpose
user_id| BIGINT PRIMARY KEY| Unique user identifier
name| VARCHAR(100)| Customer name
email| VARCHAR(255) UNIQUE| Login and contact email
password_hash| VARCHAR(255)| Securely hashed password
created_at| TIMESTAMP| Account creation time

4.2 Events

Stores concert and event information.

Column| Type| Purpose
event_id| BIGINT PRIMARY KEY| Unique event identifier
name| VARCHAR(200)| Event name
venue| VARCHAR(200)| Venue name
event_date| TIMESTAMP| Event date and time
status| VARCHAR(20)| Scheduled, on_sale, or cancelled
created_at| TIMESTAMP| Record creation time

4.3 Seats

Each row represents a seat belonging to an event.

Column| Type| Purpose
seat_id| BIGINT PRIMARY KEY| Unique seat identifier
event_id| BIGINT FOREIGN KEY| References Events
seat_label| VARCHAR(20)| Seat label, such as A1
price| DECIMAL(10,2)| Ticket price
status| VARCHAR(20)| Available, held, or sold
hold_id| UUID NULL| Identifies the active hold
hold_expires_at| TIMESTAMP NULL| Expiration time of the hold

A unique constraint on "(event_id, seat_label)" prevents duplicate seat definitions for the same event.

4.4 Orders

Stores customer purchases and booking status.

Column| Type| Purpose
order_id| BIGINT PRIMARY KEY| Unique order identifier
user_id| BIGINT FOREIGN KEY| References Users
status| VARCHAR(20)| Pending, paid, cancelled, or failed
total_amount| DECIMAL(10,2)| Total purchase amount
idempotency_key| VARCHAR(100) UNIQUE| Prevents duplicate order creation
created_at| TIMESTAMP| Order creation time

4.5 Order Items

An order may contain multiple tickets, so a separate table links orders to seats.

Column| Type| Purpose
order_item_id| BIGINT PRIMARY KEY| Unique order-item identifier
order_id| BIGINT FOREIGN KEY| References Orders
seat_id| BIGINT FOREIGN KEY| References Seats
ticket_price| DECIMAL(10,2)| Price recorded at purchase

A unique constraint on "seat_id" in Order Items prevents the same seat from being assigned to two different purchased order items.

4.6 Payments

Stores payment references and their statuses without storing raw card details.

Column| Type| Purpose
payment_id| BIGINT PRIMARY KEY| Unique payment identifier
order_id| BIGINT FOREIGN KEY| References Orders
provider_reference| VARCHAR(150) UNIQUE| Payment provider transaction reference
amount| DECIMAL(10,2)| Amount charged
status| VARCHAR(20)| Pending, successful, or failed
created_at| TIMESTAMP| Payment creation time

4.7 Table Relationships

- One user can create many orders.
- One event can have many seats.
- One order can contain many order items.
- Each order item refers to one seat.
- Each seat belongs to one event.
- One order can have multiple payment attempts, but each successful payment must be handled idempotently.
- A purchased seat must have exactly one successful ticket assignment.

The main relationships are:

"Users 1 ─── many Orders"

"Events 1 ─── many Seats"

"Orders 1 ─── many Order Items"

"Seats 1 ─── 0 or 1 Order Items"

"Orders 1 ─── many Payments"

5. Architecture

5.1 Architecture Diagram

                    Customers
                        |
                        v
               +------------------+
               | CDN / Web Client |
               +------------------+
                        |
                        v
               +------------------+
               | Load Balancer    |
               +------------------+
                        |
                        v
               +------------------+
               | Waiting Room and |
               | Rate Limiter      |
               +------------------+
                        |
                        v
               +------------------+
               | API Gateway      |
               +------------------+
                        |
             +----------+-----------+
             |          |           |
             v          v           v
      +-----------+ +----------+ +-------------+
      | Event     | | Booking  | | User and    |
      | Service   | | Service  | | Ticket API  |
      +-----------+ +----------+ +-------------+
           |            |               |
           v            |               v
      +-----------+     |         +-------------+
      | Cache     |     |         | User /      |
      | (Events)  |     |         | Ticket Data |
      +-----------+     |         +-------------+
                        v
               +------------------+
               | Relational       |
               | Database         |
               | Transactions and |
               | Constraints      |
               +------------------+
                        |
                        v
               +------------------+
               | Payment Provider |
               +------------------+
                        |
                        v
               +------------------+
               | Verified Payment |
               | Webhook Handler  |
               +------------------+
                        |
                        v
               +------------------+
               | Order and Seat   |
               | Status Updates   |
               +------------------+

       +--------------------------------------+
       | Message Queue, Notifications, Logs,   |
       | Metrics, Alerts, and Background Jobs |
       +--------------------------------------+

5.2 Component Explanations

CDN and Web Client

The CDN serves static files such as images, JavaScript, CSS, and event posters. This reduces the load on application servers.

Load Balancer

Distributes incoming requests across multiple application instances. More instances can be added during a popular sale.

Waiting Room and Rate Limiter

Controls how many customers enter the purchase flow at a time. It limits abusive traffic and helps give legitimate customers a fair opportunity.

API Gateway

Routes requests to the appropriate service and applies authentication, request validation, and rate limits.

Event Service and Cache

Handles event listings and event details. Frequently accessed event information can be cached because it changes less frequently than seat ownership.

Seat availability must not be treated as permanently correct cached data. The booking service must always verify seat availability in the database before confirming a hold.

Booking Service

Handles seat holds, order creation, expiration, and ticket assignment. It uses database transactions and constraints to prevent double-booking.

Relational Database

Stores users, events, seats, orders, order items, and payments. Transactions protect changes that must happen together.

Payment Provider and Webhook Handler

The payment provider processes payments. The webhook handler verifies payment notifications and safely updates order status. Duplicate notifications must not create duplicate purchases.

Message Queue and Background Jobs

Handles non-critical work such as email delivery, ticket notifications, analytics, and expired-hold cleanup. This work should not unnecessarily block the seat-holding request.

Monitoring and Logging

Tracks response times, errors, database contention, queue length, payment failures, and seat-hold success rates. Alerts help operators react to problems during a sale.

5.3 How the Architecture Handles the Big Sale

During a popular concert sale, 200,000 people may try to purchase 20,000 seats in 10 minutes.

The waiting room limits the number of customers entering the booking flow simultaneously. The load balancer distributes requests across application instances, and cached event information reduces repeated database reads.

The booking service uses a relational database to coordinate seat ownership. When multiple customers request the same seat, the database allows only one transaction to reserve it successfully. Other customers receive an unavailable-seat response and can choose another seat.

Database connection pools and sensible transaction timeouts prevent the application from opening an excessive number of database connections. The service can also apply backpressure when the database approaches capacity.

The message queue moves notifications and other non-critical tasks out of the immediate booking process. Monitoring and autoscaling help the system respond to increased load.

The design must be load-tested before a major sale. If the database cannot sustain the expected request rate, the waiting room must slow admission rather than overwhelm the database or weaken booking correctness.

6. Preventing Double-Booking

Preventing two customers from buying the same seat is the most important correctness requirement.

A seat's status alone is not enough. Two requests might read the same seat as available before either request updates it. The database must coordinate competing requests.

6.1 Atomic Seat Holds

When a customer requests a seat, the booking service starts a database transaction and attempts an atomic update.

Conceptually:

BEGIN;

UPDATE Seats
SET status = 'held',
    hold_id = :hold_id,
    hold_expires_at = :expires_at
WHERE seat_id = :seat_id
  AND (
    status = 'available'
    OR (
      status = 'held'
      AND hold_expires_at < CURRENT_TIMESTAMP
    )
  );

-- The application checks the affected-row count.
-- Exactly one affected row means the seat was held.
-- Zero affected rows means the seat is not available.

COMMIT;

This is illustrative SQL; the production implementation must also validate the event, hold ownership, transaction isolation, and multi-seat requests.

The database evaluates the update under concurrency control. If two customers attempt to hold the same seat, only one can successfully change the seat from an eligible state. The other request must not report a successful hold.

For a request involving several seats, the application should acquire them in a consistent order and roll back the transaction if any required seat cannot be held. This prevents a customer from receiving only part of an intended booking.

6.2 Database Constraints

The system also enforces:

- A primary key on each seat.
- A unique constraint on "(event_id, seat_label)".
- A unique constraint on "OrderItems.seat_id", ensuring a seat is assigned to at most one purchased order item.
- Foreign keys linking orders, users, events, seats, and payments.
- Valid status transitions so that a sold seat cannot return to available through an ordinary hold-expiration process.

Application checks alone are insufficient because concurrent requests may pass the same check. Database constraints provide a final layer of protection.

6.3 Expiring Holds

A seat hold expires after five minutes if the customer has not completed the purchase.

An expiration worker can find expired holds and release them, but it must update a seat only when the stored hold identifier matches the hold being expired. Otherwise, an old cleanup job might accidentally release a newer customer's hold.

For example, a cleanup update should require both the matching "hold_id" and an expiration time in the past.

6.4 Payment and Confirmation

The booking service creates a pending order associated with the held seats. Payment is processed through an external provider.

The system confirms the order only after verifying the provider's successful payment notification. It must also ensure that the seats remain protected while payment is being finalized.

The implementation must define what happens if payment succeeds after a hold expires. It must not silently assign a seat that has already been sold to someone else. A payment that cannot be matched to a valid booking should enter a reconciliation or refund process.

Payment requests and webhook processing use idempotency keys so that retries do not create duplicate charges or confirmations.

Result: Atomic database updates, transactions, unique constraints, expiring holds, and idempotent payment processing prevent duplicate seat assignments while preserving a clear booking process.

7. Trade-Offs
Trade-Off 1: Strong Consistency vs. Performance
Using database transactions and constraints protects customers from double-booking. However, concurrent attempts to hold popular seats may cause database contention and slower responses.
The system prioritizes correctness for seat ownership and payment confirmation. Caching is used for event descriptions and other data that can tolerate slightly stale results, while the booking service checks the database before confirming a hold.
Trade-Off 2: Fairness vs. Immediate Access
A waiting room improves fairness and protects the database from sudden traffic spikes. However, it makes some customers wait even when application servers might otherwise have spare capacity.
TicketHub prioritizes predictable access and system stability during major sales. Queue policies should be transparent and monitored to reduce unfair treatment.
Trade-Off 3: Relational Database vs. Distributed Database
A relational database simplifies transactions, relationships, and unique constraints. It is a strong choice for preventing double-booking.
However, scaling a highly contended database can be more difficult than scaling stateless application servers. The initial design uses a relational database and horizontal application scaling. Database partitioning or other scaling techniques can be evaluated later using measured workloads, without weakening seat-ownership guarantees.
Trade-Off 4: Five-Minute Holds vs. Customer Convenience
Short holds make tickets available again quickly when customers abandon checkout. However, customers with slow connections or payment delays may lose their seats.
A five-minute hold provides a reasonable starting point. The system can show a countdown and test whether a different hold duration improves completion rates without unnecessarily locking inventory.
