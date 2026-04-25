-- Create recipients table in backend database
CREATE TABLE IF NOT EXISTS recipients (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    relationship VARCHAR(100),
    address TEXT,
    is_verified BOOLEAN DEFAULT false,
    verification_code VARCHAR(50),
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_recipients_user_id ON recipients(user_id);
CREATE INDEX IF NOT EXISTS idx_recipients_email ON recipients(email);
CREATE INDEX IF NOT EXISTS idx_recipients_is_verified ON recipients(is_verified);
