"""Add passed column to test_sessions

Revision ID: 001
Revises: 
Create Date: 2025-11-09

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Add passed column to test_sessions table"""
    # Add the column
    op.add_column('test_sessions', 
        sa.Column('passed', sa.Integer(), nullable=True, server_default='0')
    )
    
    # Update existing records based on score_percentage
    op.execute("""
        UPDATE test_sessions 
        SET passed = CASE 
            WHEN score_percentage >= 75 THEN 1 
            ELSE 0 
        END
    """)


def downgrade() -> None:
    """Remove passed column from test_sessions table"""
    op.drop_column('test_sessions', 'passed')

