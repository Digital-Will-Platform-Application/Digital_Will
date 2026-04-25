-- Create wills table
CREATE TABLE IF NOT EXISTS wills (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL DEFAULT 'My Will',
    type VARCHAR(50) NOT NULL DEFAULT 'chat',
    status VARCHAR(50) NOT NULL DEFAULT 'draft',
    content TEXT,
    transcript TEXT,
    audio_url TEXT,
    video_url TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_wills_user_id ON wills(user_id);
CREATE INDEX IF NOT EXISTS idx_wills_status ON wills(status);
CREATE INDEX IF NOT EXISTS idx_wills_type ON wills(type);
