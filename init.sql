CREATE TABLE IF NOT EXISTS predictions (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL,
    prediction VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert some initial data
INSERT INTO predictions (username, prediction) VALUES 
('Gunner99', 'Arsenal 3 - 0 Spurs'),
('NorthLondonIsRed', 'Arsenal 2 - 1 City');