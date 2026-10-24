-- Fixtures table
CREATE TABLE IF NOT EXISTS fixtures (
    id SERIAL PRIMARY KEY,
    opponent VARCHAR(100) NOT NULL,
    competition VARCHAR(50) NOT NULL,
    match_date TIMESTAMP NOT NULL,
    venue VARCHAR(50) NOT NULL,
    home_score INTEGER,
    away_score INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Predictions table (references fixtures)
CREATE TABLE IF NOT EXISTS predictions (
    id SERIAL PRIMARY KEY,
    fixture_id INTEGER REFERENCES fixtures(id) ON DELETE CASCADE,
    username VARCHAR(100) NOT NULL,
    home_score INTEGER NOT NULL,
    away_score INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed fixtures (past ones have final scores; future ones don't)
INSERT INTO fixtures (opponent, competition, match_date, venue, home_score, away_score) VALUES
('Spurs',    'Premier League',   '2026-10-15 18:30:00', 'Home', 3, 1),
('Chelsea',  'Premier League',   '2026-10-20 20:00:00', 'Away', 1, 1),
('PSG',      'Champions League', '2026-11-02 20:00:00', 'Home', NULL, NULL),
('Liverpool','Premier League',   '2026-11-09 16:30:00', 'Away', NULL, NULL),
('Man City', 'Premier League',   '2026-11-16 17:30:00', 'Home', NULL, NULL);

-- Seed some predictions on past fixtures (for leaderboard demo)
INSERT INTO predictions (fixture_id, username, home_score, away_score) VALUES
(1, 'Gunner99',   3, 1),  -- exact: 3 pts
(1, 'AFC_Forever',2, 0),  -- correct winner: 1 pt
(1, 'NoBot',1, 2),  -- wrong: 0 pts
(2, 'Gunner99',   2, 1),  -- wrong winner: 0 pts
(2, 'AFC_Forever',1, 1),  -- exact: 3 pts
(2, 'NoBot',0, 0);  -- exact: 3 pts