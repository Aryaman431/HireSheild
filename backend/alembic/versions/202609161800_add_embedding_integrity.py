"""Add embedding uniqueness and required vectors.

Revision ID: 202609161800
Revises: 77906d9f84f3
Create Date: 2026-09-16 18:00:00.000000
"""
from alembic import op
import sqlalchemy as sa
from pgvector.sqlalchemy import Vector

revision = "202609161800"
down_revision = "77906d9f84f3"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    embedding_columns = {column["name"]: column for column in inspector.get_columns("embeddings")}

    if embedding_columns["vector"].get("nullable", True):
        op.alter_column("embeddings", "vector", existing_type=Vector(768), nullable=False)

    unique_constraints = {
        constraint.get("name") for constraint in inspector.get_unique_constraints("embeddings")
    }
    if "uq_embedding_reference" not in unique_constraints:
        op.create_unique_constraint(
            "uq_embedding_reference",
            "embeddings",
            ["reference_type", "reference_id"],
        )


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    unique_constraints = {
        constraint.get("name") for constraint in inspector.get_unique_constraints("embeddings")
    }
    if "uq_embedding_reference" in unique_constraints:
        op.drop_constraint("uq_embedding_reference", "embeddings", type_="unique")

    embedding_columns = {column["name"]: column for column in inspector.get_columns("embeddings")}
    if not embedding_columns["vector"].get("nullable", True):
        op.alter_column("embeddings", "vector", existing_type=Vector(768), nullable=True)
