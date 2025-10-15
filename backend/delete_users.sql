-- Disable foreign key checks to avoid constraint errors
SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE api_user;

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;
