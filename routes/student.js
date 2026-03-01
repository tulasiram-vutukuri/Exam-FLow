const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Get available exams
router.get('/available-exams', async (req, res) => {
    try {
        const [exams] = await db.execute('SELECT * FROM exams WHERE status = "published"');
        res.json(exams);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching exams' });
    }
});

// Get exam by code
router.get('/exam/:code', async (req, res) => {
    const { code } = req.params;
    try {
        const [exams] = await db.execute('SELECT id, title, exam_code, scheduled_at, duration FROM exams WHERE exam_code = ? AND status = "published"', [code]);
        if (exams.length === 0) return res.status(404).json({ message: 'Exam not found' });

        // Server-side schedule check
        const now = new Date();
        const scheduledTime = new Date(exams[0].scheduled_at);
        if (now < scheduledTime) {
            return res.status(403).json({
                message: `Exam is scheduled for ${scheduledTime.toLocaleString()}. Please come back then.`
            });
        }

        const [questions] = await db.execute('SELECT id, question, option_a, option_b, option_c, option_d FROM questions WHERE exam_id = ?', [exams[0].id]);
        res.json({ exam: exams[0], questions });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching exam' });
    }
});

// Submit Exam
router.post('/submit-exam', async (req, res) => {
    const { student_username, exam_id, answers } = req.body;

    try {
        // Fetch correct answers
        const [questions] = await db.execute('SELECT id, correct_option FROM questions WHERE exam_id = ?', [exam_id]);

        let score = 0;
        const total = questions.length;

        questions.forEach(q => {
            if (answers[q.id] === q.correct_option) {
                score++;
            }
        });

        await db.execute(
            'INSERT INTO results (student_username, exam_id, score, total) VALUES (?, ?, ?, ?)',
            [student_username, exam_id, score, total]
        );

        res.json({ score, total });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error submitting exam' });
    }
});

// Get past results for a student
router.get('/past-results/:username', async (req, res) => {
    const { username } = req.params;
    try {
        const [results] = await db.execute(`
            SELECT r.*, e.title 
            FROM results r 
            JOIN exams e ON r.exam_id = e.id 
            WHERE r.student_username = ? 
            ORDER BY r.submitted_at DESC
        `, [username]);
        res.json(results);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching past results' });
    }
});

module.exports = router;
