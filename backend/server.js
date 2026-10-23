const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Serve static frontend files
app.use(express.static(path.join(__dirname, '../frontend')));

// Database connection (uses environment variables set in docker-compose)
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST, 
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

// API Endpoints
app.get('/api/predictions', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM predictions ORDER BY id DESC');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

app.post('/api/predictions', async (req, res) => {
    const { username, prediction } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO predictions (username, prediction) VALUES ($1, $2) RETURNING *',
            [username, prediction]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

// Health check endpoint for AWS Load Balancer
app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

// Endpoint to identify which instance handled the request
app.get('/api/whoami', (req, res) => {
    const os = require('os');
    res.json({ 
        hostname: os.hostname(),
        timestamp: new Date().toISOString()
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});