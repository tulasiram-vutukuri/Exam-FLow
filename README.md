# ExamFlow  
Online Examination and Result Processing System

ExamFlow is a full-stack web application that allows administrators to create, schedule, manage, and delete exams, while enabling students to attend exams with a real-time countdown timer and automatic submission system.

The application follows a clear frontend-backend separation and focuses on secure scheduling, timed assessments, and structured result processing.

------------------------------------------------------------

Project Overview

The goal of this project is to build a secure and practical online examination platform where:

- Admins can create, schedule, and delete exams.
- Students can attempt exams only after the scheduled time.
- A real-time countdown timer controls exam duration.
- Exams are automatically submitted when time expires.
- Results are processed and displayed immediately.

This project reflects a structured, internship-level full-stack implementation using Node.js and MySQL.

------------------------------------------------------------

Core Features

Admin Features

- Secure admin authentication
- Create new exams
- Schedule exams with date and time
- Set exam duration (in minutes)
- Delete scheduled exams
- View all scheduled exams on dashboard
- Manage complete exam workflow

Student Features

- Secure student login
- View upcoming and available exams
- Restriction from starting exams before scheduled time
- Real-time countdown timer during exam
- Automatic submission at time expiry
- Immediate result display

------------------------------------------------------------

Exam Scheduling and Timer Logic

1. Database Enhancements

The exams table includes:

- scheduled_at (DATETIME)
- duration (INT)

These fields allow:
- Controlled exam scheduling
- Accurate duration management

2. Schedule Enforcement

Students cannot start exams before the scheduled time.

Validation is implemented:
- On the frontend (UI restriction)
- On the backend (secure validation)

Even if frontend is bypassed, backend logic prevents early access.

3. Countdown Timer

- Starts when the student begins the exam
- Displayed in the navigation bar
- Updates in real time
- Based on duration defined by admin

4. Auto-Submission

When the timer reaches 0:00:
- Exam is automatically submitted
- Student is redirected to results page
- No manual submission required

------------------------------------------------------------

Verification Testing

The implementation was verified through end-to-end browser testing:

1. Created a 1-minute exam scheduled in the immediate past.
2. Logged in as a student.
3. Started the exam.
4. Observed timer starting at 1:00.
5. Confirmed automatic submission at 0:00.
6. Verified redirection to results page.

All functionalities worked as expected.

------------------------------------------------------------

Technologies Used

Frontend:
- HTML
- CSS
- JavaScript

Backend:
- Node.js
- Express.js

Database:
- MySQL

------------------------------------------------------------

Installation and Setup

1. Clone the repository

git clone https://github.com/tulasiram-vutukuri/Exam-FLow.git  
cd Exam-FLow

2. Install dependencies

npm install

3. Configure environment variables

Create a .env file in the root directory and add:

DB_HOST=your_host  
DB_USER=your_user  
DB_PASSWORD=your_password  
DB_NAME=your_database  
JWT_SECRET=your_secret  

4. Setup database

Import:

database/schema.sql

into your MySQL server.

5. Run the server

node server.js

Open in browser:

http://localhost:3000

------------------------------------------------------------

Default Credentials (For Testing)

Admin  
Username: admin@09  
Password: admin@22  

Student  
Username: VTUXXXXX  
Password: VTUXXXXX (any 5-digit number)

------------------------------------------------------------

Security Notes

- node_modules is excluded from version control.
- .env file is not uploaded for security reasons.
- Environment variables are managed locally or on deployment platforms.

------------------------------------------------------------

Project Objective

This project demonstrates:

- Full-stack architecture
- Backend validation and enforcement
- Real-time timer implementation
- Secure exam scheduling
- Automatic result processing
- Clean separation of frontend and backend logic

It simulates a real-world online examination workflow with proper backend control and time-based access enforcement.
