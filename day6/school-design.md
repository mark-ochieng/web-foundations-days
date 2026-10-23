# Day 6: School Database Design

## Tables

**students** stores one row per student: a unique `student_id` (primary key), the student's `name`, and their `email`. The email is `NOT NULL` and `UNIQUE`, so two students cannot share an address.

**courses** stores one row per course: a unique `course_id` (primary key), a `title`, and a short `code` such as IT201. Both are `NOT NULL`, and the code is `UNIQUE`.

**enrolments** records the fact that a particular student is taking a particular course. It holds its own `enrolment_id`, a `student_id` and `course_id` (both foreign keys, both `NOT NULL`), and the `grade`. The grade can be `NULL` because a student may be enrolled before any grade exists. A `UNIQUE (student_id, course_id)` rule stops the same student enrolling on the same course twice.

## Relationships

- **students to enrolments: one-to-many.** One student can have many enrolments, but each enrolment belongs to exactly one student.
- **courses to enrolments: one-to-many.** One course can have many enrolments, but each enrolment belongs to exactly one course.
- **students to courses: many-to-many.** A student can take many courses, and a course has many students.

A join table is needed because a many-to-many relationship cannot be stored in a single column without repeating data or putting several values in one cell. The `enrolments` table breaks it into two one-to-many relationships. It is also the natural place for data that belongs to the pairing itself, such as the grade, which is not a property of the student alone or the course alone.

## Index

I would add an index on `enrolments(course_id)`. The unique rule on `(student_id, course_id)` already gives fast lookups by student, but queries such as "all students on one course" and "students per course" filter or group by `course_id` and would otherwise scan the whole enrolments table. The index keeps those queries fast as the number of enrolments grows.

## SQL or NoSQL?

I would choose SQL for this system. The data is highly structured and relational: students, courses and enrolments link to each other in a fixed pattern, and the rules matter (unique emails, no duplicate enrolments, no enrolment for a student or course that does not exist). A relational database enforces these rules through keys and constraints, and handles queries across tables, like counting students per course, with JOIN and GROUP BY. A NoSQL document store would suit flexible, changing data or huge scale, but here it would push the integrity checks into application code and make cross-collection queries harder.
