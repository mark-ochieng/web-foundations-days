# Library API Design

## Overview

The Library API is a REST API for managing books in a library.
It allows clients to list, search, retrieve, create, update, and
delete book records.

Base URL: `https://api.example.com/v1`

Content type: `application/json`

## Book Data Structure

Each book has the following fields:

- `id`: Unique book identifier
- `title`: Book title
- `author`: Book author
- `isbn`: International Standard Book Number
- `available`: Whether the book is available for borrowing

Example book:

```json
{
  "id": 1,
  "title": "Introduction to Computing",
  "author": "Jane Smith",
  "isbn": "9781234567890",
  "available": true
}
```

## 1. List All Books

- **Method:** GET
- **Path:** `/books`
- **Description:** Returns a list of all books in the library.
- **Request body:** None
- **Success status:** `200 OK`

Example request:

`GET /v1/books`

Example response:

```json
[
  {
    "id": 1,
    "title": "Introduction to Computing",
    "author": "Jane Smith",
    "isbn": "9781234567890",
    "available": true
  }
]
```

## 2. Get a Book by ID

- **Method:** GET
- **Path:** `/books/{id}`
- **Description:** Returns the details of one book using its ID.
- **Request body:** None
- **Success status:** `200 OK`
- **Error status:** `404 Not Found` if the book does not exist.

Example request:

`GET /v1/books/1`

## 3. Create a Book

- **Method:** POST
- **Path:** `/books`
- **Description:** Adds a new book to the library.
- **Success status:** `201 Created`
- **Error status:** `400 Bad Request` if required fields are missing
  or the supplied data is invalid.

Example request body:

```json
{
  "title": "Web Development Basics",
  "author": "John Doe",
  "isbn": "9781234567891",
  "available": true
}
```

The server assigns a unique ID to the new book.

## 4. Replace a Book

- **Method:** PUT
- **Path:** `/books/{id}`
- **Description:** Replaces the stored details of an existing book.
- **Request body:** The complete updated book representation,
  excluding the server-assigned ID.
- **Success status:** `200 OK`
- **Error status:** `404 Not Found` if the book does not exist.

Example request:

`PUT /v1/books/1`

Example request body:

```json
{
  "title": "Advanced Computing",
  "author": "Jane Smith",
  "isbn": "9781234567892",
  "available": false
}
```

## 5. Partially Update a Book

- **Method:** PATCH
- **Path:** `/books/{id}`
- **Description:** Updates only the specified fields of an existing book.
- **Request body:** Only the fields that need to change.
- **Success status:** `200 OK`
- **Error status:** `404 Not Found` if the book does not exist.

Example request:

`PATCH /v1/books/1`

Example request body:

```json
{
  "available": false
}
```

## 6. Delete a Book

- **Method:** DELETE
- **Path:** `/books/{id}`
- **Description:** Removes a book record from the library.
- **Request body:** None
- **Success status:** `204 No Content`
- **Error status:** `404 Not Found` if the book does not exist.

Example request:

`DELETE /v1/books/1`

A successful deletion returns no response body.

## 7. Search Books by Author

- **Method:** GET
- **Path:** `/books?author={author}`
- **Description:** Returns books whose author matches the supplied
  author query parameter.
- **Request body:** None
- **Success status:** `200 OK`

Example request:

`GET /v1/books?author=Jane%20Smith`

The server returns a list of matching books. If no books match,
it returns `200 OK` with an empty JSON array.

## Error Responses

### 400 Bad Request

Returned when the request contains invalid data, a missing required
field, or an incorrectly formatted value.

Example request:

`POST /v1/books`

Example response:

```json
{
  "error": "Bad Request",
  "message": "The title and author fields are required."
}
```

### 404 Not Found

Returned when a requested book ID does not exist.

Example request:

`GET /v1/books/9999`

Example response:

```json
{
  "error": "Not Found",
  "message": "Book with ID 9999 was not found."
}
```

## API Design Notes

- GET retrieves data without changing stored records.
- POST creates a new resource.
- PUT replaces an existing resource.
- PATCH updates selected fields.
- DELETE removes a resource.
- Query parameters support searching and filtering.
- JSON is used for request and response data.
- HTTP status codes communicate success and errors.
- A production API should validate inputs and authenticate
  and authorize clients before allowing protected operations.