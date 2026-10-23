PRAGMA foreign_keys = ON;

CREATE TABLE students (
    student_id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE
);

CREATE TABLE courses (
    course_id INTEGER PRIMARY KEY,
    title TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE
);

CREATE TABLE enrolments (
    enrolment_id INTEGER PRIMARY KEY,
    student_id INTEGER NOT NULL,
    course_id INTEGER NOT NULL,
    grade INTEGER CHECK (grade BETWEEN 0 AND 100),
    FOREIGN KEY (student_id) REFERENCES students (student_id),
    FOREIGN KEY (course_id) REFERENCES courses (course_id),
    UNIQUE (student_id, course_id)
);

INSERT INTO students (student_id, name, email) VALUES
    (1, 'Amina Otieno', 'amina@example.com'),
    (2, 'Brian Kamau', 'brian@example.com'),
    (3, 'Cynthia Wanjiru', 'cynthia@example.com'),
    (4, 'David Mwangi', 'david@example.com');

INSERT INTO courses (course_id, title, code) VALUES
    (1, 'Database Systems', 'IT201'),
    (2, 'Web Development', 'IT202'),
    (3, 'Software Engineering', 'IT203');

INSERT INTO enrolments (student_id, course_id, grade) VALUES
    (1, 1, 78),
    (1, 2, 85),
    (2, 1, 64),
    (3, 2, 72),
    (3, 3, NULL),
    (2, 3, 90);

-- Query 1: all courses for one student (by name)
SELECT c.code, c.title, e.grade
FROM students s
JOIN enrolments e ON e.student_id = s.student_id
JOIN courses c ON c.course_id = e.course_id
WHERE s.name = 'Amina Otieno';

-- Query 2: all students on one course
SELECT s.name, s.email, e.grade
FROM courses c
JOIN enrolments e ON e.course_id = c.course_id
JOIN students s ON s.student_id = e.student_id
WHERE c.code = 'IT201';

-- Query 3: number of students per course
SELECT c.code, c.title, COUNT(e.enrolment_id) AS student_count
FROM courses c
LEFT JOIN enrolments e ON e.course_id = c.course_id
GROUP BY c.course_id, c.code, c.title;

-- Query 4: students who have no enrolments
SELECT s.name, s.email
FROM students s
LEFT JOIN enrolments e ON e.student_id = s.student_id
WHERE e.enrolment_id IS NULL;

-- Query 5: update one enrolment's grade
UPDATE enrolments
SET grade = 82
WHERE student_id = (SELECT student_id FROM students WHERE name = 'Cynthia Wanjiru')
  AND course_id = (SELECT course_id FROM courses WHERE code = 'IT203');

SELECT * FROM enrolments;
