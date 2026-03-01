const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
// Routes
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const studentRoutes = require('./routes/student');

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/student', studentRoutes);

app.use(express.static(path.join(__dirname, 'public')));

// Database connection check
const db = require('./config/db');
db.execute('SELECT 1').then(() => {
    console.log('✅ MySQL Database Connected Successfully');
}).catch(err => {
    console.error('❌ Database Connection Failed:', err.message);
});

// View routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/pages/login.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
