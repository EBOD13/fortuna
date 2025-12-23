from app.database import engine, SessionLocal
from sqlalchemy import text

def test_connection():
    print("Testing database connection...")

    try:
        # Test connection
        with engine.connect() as conn:
            result = conn.execute(text("SELECT version();"))
            print(f"Connected to PostgresSQL: {result.fetchone()[0]}")

        # Test session
        db = SessionLocal()
        result = db.execute(text("SELECT COUNT(*) FROM users;"))
        print(f"Users table accessible: {result.fetchone()[0]} users")
        db.close()

        print("Database connection successful")
    except Exception as e:
        print(f"\n Database connection failed:{e}")

if __name__ == "__main__":
    test_connection()
