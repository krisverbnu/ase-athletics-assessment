// Runs before every test file. Tests never touch the real database or the real secret.
process.env.JWT_SECRET = 'test-secret-only-used-in-tests';
