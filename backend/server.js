const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');
const os = require('os');

const app = express();
app.use(cors());
app.use(express.json());

// Serve static frontend files
app.use(express.static(path.join(__dirname, '../frontend')));

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

// --- UPGRADED HEALTH CHECK: verifies DB connectivity ---
app.get('/health', async (req, res) => {
    try {
        await pool.query('SELECT 1');
        res.status(200).json({ status: 'healthy', db: 'connected', timestamp: new Date().toISOString() });
    } catch (err) {
        res.status(503).json({ status: 'unhealthy', db: 'disconnected' });
    }
});

// --- Debug endpoint for load balancer demonstration ---
app.get('/api/whoami', (req, res) => {
    res.json({
        containerId: os.hostname(),
        instanceIp: req.socket.localAddress,
        timestamp: new Date().toISOString()
    });
});

// --- GET all fixtures (with prediction count) ---
app.get('/api/fixtures', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT f.*, COUNT(p.id)::int AS prediction_count
            FROM fixtures f
            LEFT JOIN predictions p ON p.fixture_id = f.id
            GROUP BY f.id
            ORDER BY f.match_date ASC
        `);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

// --- GET predictions for a specific fixture ---
app.get('/api/fixtures/:id/predictions', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM predictions WHERE fixture_id = $1 ORDER BY created_at DESC',
            [req.params.id]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

// --- POST a new prediction against a fixture ---
app.post('/api/predictions', async (req, res) => {
    const { fixture_id, username, home_score, away_score } = req.body;

    // Business logic: validate scores are non-negative integers
    if (!fixture_id || !username ||
        !Number.isInteger(home_score) || home_score < 0 ||
        !Number.isInteger(away_score) || away_score < 0) {
        return res.status(400).json({ error: 'Invalid input' });
    }

    try {
        const result = await pool.query(
            `INSERT INTO predictions (fixture_id, username, home_score, away_score)
             VALUES ($1, $2, $3, $4) RETURNING *`,
            [fixture_id, username, home_score, away_score]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

// --- FINALIZE a fixture's result (admin action for demo) ---
app.post('/api/fixtures/:id/finalize', async (req, res) => {
    const { home_score, away_score } = req.body;
    const fixtureId = req.params.id;

    if (!Number.isInteger(home_score) || home_score < 0 ||
        !Number.isInteger(away_score) || away_score < 0) {
        return res.status(400).json({ error: 'Invalid scores' });
    }

    try {
        // Only allow finalizing fixtures that don't yet have a result
        const result = await pool.query(
            `UPDATE fixtures
             SET home_score = $1, away_score = $2
             WHERE id = $3 AND home_score IS NULL
             RETURNING *`,
            [home_score, away_score, fixtureId]
        );

        if (result.rows.length === 0) {
            return res.status(400).json({ error: 'Fixture not found or already finalized' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

// --- RESET all predictions + clear final scores (demo only) ---
app.post('/api/admin/reset', async (req, res) => {
    try {
        await pool.query('TRUNCATE predictions RESTART IDENTITY CASCADE');
        await pool.query('UPDATE fixtures SET home_score = NULL, away_score = NULL WHERE id > 2');
        res.json({ status: 'reset', fixtures: 'cleared results', predictions: 'deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Reset failed' });
    }
});

// --- LEADERBOARD: join + aggregation with point scoring ---
app.get('/api/leaderboard', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT p.username,
                   COUNT(p.id)::int AS predictions_made,
                   SUM(
                       CASE
                           WHEN p.home_score = f.home_score AND p.away_score = f.away_score THEN 3
                           WHEN (p.home_score > p.away_score AND f.home_score > f.away_score)
                             OR (p.home_score < p.away_score AND f.home_score < f.away_score)
                             OR (p.home_score = p.away_score AND f.home_score = f.away_score) THEN 1
                           ELSE 0
                       END
                   )::int AS total_points
            FROM predictions p
            JOIN fixtures f ON p.fixture_id = f.id
            WHERE f.home_score IS NOT NULL
            GROUP BY p.username
            ORDER BY total_points DESC, predictions_made ASC
        `);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});