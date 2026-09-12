"""create the initial HireShield schema

Revision ID: 202609121959
Revises: 
Create Date: 2026-09-12 19:59:00.000000

"""
from alembic import op
from app.models import Base

# revision identifiers, used by Alembic.
revision = '202609121959'
down_revision = None
branch_labels = None
depends_on = None

def upgrade() -> None:
    bind = op.get_bind()
    # pgvector must exist before SQLAlchemy creates the embedding table.
    bind.exec_driver_sql("CREATE EXTENSION IF NOT EXISTS vector")
    Base.metadata.create_all(bind, checkfirst=True)

def downgrade() -> None:
    bind = op.get_bind()
    Base.metadata.drop_all(bind, checkfirst=True)
