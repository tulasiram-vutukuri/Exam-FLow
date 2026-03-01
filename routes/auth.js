const express = require('express');
const router = express.Router();
const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Login Route
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        // Special handle for Admin creds as requested
        if (username === 'Admin@09' && password === 'Admin@22') {
            const token = jwt.sign(
                { id: 0, username: 'Admin@09', role: 'admin' },
                process.env.JWT_SECRET,
                { expiresIn: '1h' }
            );
            return res.json({ token, role: 'admin', username: 'Admin@09' });
        }

        // Special handle for Student creds: VTUXXXXX / VTUXXXXX
        const isStudentFormat = /^VTU\d{5}$/.test(username);
        if (isStudentFormat && username === password) {
            // Check if user exists, if not create
            let [users] = await db.execute('SELECT * FROM users WHERE username = ?', [username]);

            if (users.length === 0) {
                const hashedPassword = await bcrypt.hash(password, 10);
                await db.execute('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', [username, hashedPassword, 'student']);
                [users] = await db.execute('SELECT * FROM users WHERE username = ?', [username]);
            }

            const user = users[0];
            const token = jwt.sign(
                { id: user.id, username: user.username, role: user.role },
                process.env.JWT_SECRET,
                { expiresIn: '1h' }
            );
            return res.json({ token, role: user.role, username: user.username });
        }

        // Standard login for other users in DB
        const [users] = await db.execute('SELECT * FROM users WHERE username = ?', [username]);
        if (users.length === 0) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const user = users[0];
        let storedHash = user.password;
        if (storedHash.startsWith('$2y$')) {
            storedHash = '$2a$' + storedHash.substring(4);
        }

        const isMatch = await bcrypt.compare(password, storedHash);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.json({ token, role: user.role, username: user.username });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
