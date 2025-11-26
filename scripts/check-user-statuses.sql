-- Check all unique status values in users table
SELECT DISTINCT status, COUNT(*) as count
FROM users
GROUP BY status
ORDER BY count DESC;

-- Show sample users with their statuses
SELECT id, name, email, status
FROM users
LIMIT 10;
