-- Create asset_allocations table in backend database (Neon/Postgres)
CREATE TABLE IF NOT EXISTS asset_allocations (
    id SERIAL PRIMARY KEY,
    asset_id INTEGER NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    recipient_id INTEGER NOT NULL REFERENCES recipients(id) ON DELETE CASCADE,
    allocation_percentage DECIMAL(5, 2) NOT NULL CHECK (allocation_percentage > 0 AND allocation_percentage <= 100),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(asset_id, recipient_id)
);

-- Indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_asset_allocations_asset_id ON asset_allocations(asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_allocations_recipient_id ON asset_allocations(recipient_id);

