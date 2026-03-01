CREATE DATABASE IF NOT EXISTS exam_portal;
USE exam_portal;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'student') NOT NULL
);

CREATE TABLE IF NOT EXISTS exams (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    exam_code VARCHAR(10) UNIQUE NOT NULL,
    scheduled_at DATETIME,
    duration INT DEFAULT 30, -- Duration in minutes
    status ENUM('draft', 'published') DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    exam_id INT NOT NULL,
    question TEXT NOT NULL,
    option_a VARCHAR(255) NOT NULL,
    option_b VARCHAR(255) NOT NULL,
    option_c VARCHAR(255) NOT NULL,
    option_d VARCHAR(255) NOT NULL,
    correct_option ENUM('A', 'B', 'C', 'D') NOT NULL,
    FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS results (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_username VARCHAR(255) NOT NULL,
    exam_id INT NOT NULL,
    score INT NOT NULL,
    total INT NOT NULL,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS student_answers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    result_id INT NOT NULL,
    question_id INT NOT NULL,
    selected_option ENUM('A', 'B', 'C', 'D'),
    is_correct BOOLEAN,
    FOREIGN KEY (result_id) REFERENCES results(id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
);

-- Insert default admin
-- Password: admin@22
INSERT IGNORE INTO users (username, password, role) VALUES ('Admin@09', '$2y$10$VPuDb7RUPf8jLwYEXKVxIuVoxiXZi9q1bwWSM2FaNaFGfKSdNzNpy', 'admin');
