from alembic import op
import sqlalchemy as sa

revision = "20251217145000"  # the new migration ID
down_revision = "321d4ec87900"  # previous applied migration
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("users", sa.Column("faculty", sa.String(255), nullable=True))
    op.add_column("users", sa.Column("direction", sa.String(255), nullable=True))


def downgrade():
    op.drop_column("users", "direction")
    op.drop_column("users", "faculty")
