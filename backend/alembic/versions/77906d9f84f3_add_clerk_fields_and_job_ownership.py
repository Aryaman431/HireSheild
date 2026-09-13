"""Add clerk fields and job ownership

Revision ID: 77906d9f84f3
Revises: 202609121959
Create Date: 2026-09-13 00:59:27.484403

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '77906d9f84f3'
down_revision: Union[str, Sequence[str], None] = '202609121959'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema — idempotent: safe to run even if initial migration already created these columns."""
    conn = op.get_bind()
    inspector = sa.inspect(conn)

    # --- users table ---
    user_columns = [c['name'] for c in inspector.get_columns('users')]

    if 'clerk_user_id' not in user_columns:
        op.add_column('users', sa.Column('clerk_user_id', sa.String(), nullable=True))

    if 'is_admin' not in user_columns:
        op.add_column('users', sa.Column('is_admin', sa.Boolean(), server_default='false', nullable=False))

    user_indexes = [idx['name'] for idx in inspector.get_indexes('users')]
    if 'ix_users_clerk_user_id' not in user_indexes:
        op.create_index(op.f('ix_users_clerk_user_id'), 'users', ['clerk_user_id'], unique=True)

    # --- job_postings table ---
    job_columns = [c['name'] for c in inspector.get_columns('job_postings')]

    if 'user_id' not in job_columns:
        op.add_column('job_postings', sa.Column('user_id', sa.String(), nullable=True))

    job_indexes = [idx['name'] for idx in inspector.get_indexes('job_postings')]
    if 'ix_job_postings_user_id' not in job_indexes:
        op.create_index(op.f('ix_job_postings_user_id'), 'job_postings', ['user_id'], unique=False)

    job_fks = [fk['name'] for fk in inspector.get_foreign_keys('job_postings')]
    if 'fk_job_postings_user_id' not in job_fks:
        op.create_foreign_key('fk_job_postings_user_id', 'job_postings', 'users', ['user_id'], ['id'], ondelete='SET NULL')


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_constraint('fk_job_postings_user_id', 'job_postings', type_='foreignkey')
    op.drop_index(op.f('ix_job_postings_user_id'), table_name='job_postings')
    op.drop_column('job_postings', 'user_id')
    
    op.drop_index(op.f('ix_users_clerk_user_id'), table_name='users')
    op.drop_column('users', 'is_admin')
    op.drop_column('users', 'clerk_user_id')
