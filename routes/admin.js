const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Create Exam
router.post('/create-exam', async (req, res) => {
    const { title, scheduled_at, duration } = req.body;
    const exam_code = Math.random().toString(36).substring(2, 8).toUpperCase();

    try {
        const [result] = await db.execute(
            'INSERT INTO exams (title, exam_code, scheduled_at, duration, status) VALUES (?, ?, ?, ?, ?)',
            [title, exam_code, scheduled_at || null, duration || 30, 'draft']
        );
        res.json({ id: result.insertId, exam_code, title });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error creating exam' });
    }
});

// Add Question
router.post('/add-question', async (req, res) => {
    const { exam_id, question, option_a, option_b, option_c, option_d, correct_option } = req.body;

    try {
        await db.execute(
            'INSERT INTO questions (exam_id, question, option_a, option_b, option_c, option_d, correct_option) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [exam_id, question, option_a, option_b, option_c, option_d, correct_option]
        );
        res.json({ message: 'Question added successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error adding question' });
    }
});

// Publish Exam
router.post('/publish-exam', async (req, res) => {
    const { exam_id } = req.body;

    try {
        await db.execute('UPDATE exams SET status = ? WHERE id = ?', ['published', exam_id]);
        res.json({ message: 'Exam published successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error publishing exam' });
    }
});

// Get All Exams (Admin Dashboard)
router.get('/exams', async (req, res) => {
    try {
        const [exams] = await db.execute('SELECT * FROM exams');
        res.json(exams);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching exams' });
    }
});

// Get Exam Results
router.get('/results/:exam_id', async (req, res) => {
    const { exam_id } = req.params;
    try {
        const [results] = await db.execute('SELECT * FROM results WHERE exam_id = ?', [exam_id]);
        res.json(results);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching results' });
    }
});

module.exports = router;
