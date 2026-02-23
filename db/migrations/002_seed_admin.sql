-- Migration: 002_seed_admin
-- Seeds a default admin user for local development
-- Password: admin123 (bcrypt hash — change before deploying to any environment)
-- Generate a new hash with: node -e "require('bcrypt').hash('yourpassword', 10).then(console.log)"

BEGIN;

INSERT INTO admin_users (email, password_hash)
VALUES (
  'admin@pregate.local',
  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'  -- password: password
)
ON CONFLICT (email) DO NOTHING;

COMMIT;
