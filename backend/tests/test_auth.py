import unittest

from app.core.security import verify_password


class PasswordHashingTest(unittest.TestCase):
    def test_seeded_demo_password_verifies(self):
        hashed_password = "$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGGa31Sg"
        self.assertTrue(verify_password("password123", hashed_password))


if __name__ == "__main__":
    unittest.main()
