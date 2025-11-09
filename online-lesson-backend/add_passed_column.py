"""
Migration script to add 'passed' column to test_sessions table
Run this script once to update the database schema
"""

import psycopg2
from app.config import settings

def add_passed_column():
    """Add passed column to test_sessions table"""
    try:
        # Connect to database
        conn = psycopg2.connect(settings.DATABASE_URL)
        cursor = conn.cursor()
        
        # Check if column already exists
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='test_sessions' AND column_name='passed'
        """)
        
        if cursor.fetchone():
            print("✓ Column 'passed' already exists in test_sessions table")
        else:
            # Add the column
            cursor.execute("""
                ALTER TABLE test_sessions 
                ADD COLUMN passed INTEGER DEFAULT 0
            """)
            conn.commit()
            print("✓ Successfully added 'passed' column to test_sessions table")
            
            # Update existing records to set passed based on score_percentage
            cursor.execute("""
                UPDATE test_sessions 
                SET passed = CASE 
                    WHEN score_percentage >= 75 THEN 1 
                    ELSE 0 
                END
            """)
            conn.commit()
            print("✓ Updated existing records with pass/fail status")
        
        cursor.close()
        conn.close()
        print("\n✅ Migration completed successfully!")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        print("\nPlease run this SQL manually in your database:")
        print("ALTER TABLE test_sessions ADD COLUMN passed INTEGER DEFAULT 0;")
        print("UPDATE test_sessions SET passed = CASE WHEN score_percentage >= 75 THEN 1 ELSE 0 END;")

if __name__ == "__main__":
    add_passed_column()

