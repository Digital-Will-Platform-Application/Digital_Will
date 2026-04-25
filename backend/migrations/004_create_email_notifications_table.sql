-- Create email_notifications table
CREATE TABLE IF NOT EXISTS email_notifications (
    id SERIAL PRIMARY KEY,
    will_id INTEGER NOT NULL REFERENCES wills(id) ON DELETE CASCADE,
    recipient_email VARCHAR(255) NOT NULL,
    recipient_name VARCHAR(255),
    subject VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    sent_at TIMESTAMP,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on will_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_email_notifications_will_id ON email_notifications(will_id);
CREATE INDEX IF NOT EXISTS idx_email_notifications_status ON email_notifications(status);
