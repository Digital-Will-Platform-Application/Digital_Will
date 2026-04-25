-- Primary admin (ADMIN_EMAIL) must not carry is_secondary_admin=TRUE (bad data / mistaken update).
-- Email here must match backend .env ADMIN_EMAIL.
UPDATE users
SET is_secondary_admin = FALSE
WHERE LOWER(TRIM(email)) = LOWER(TRIM('adminlegacywallet@gmail.com'));
