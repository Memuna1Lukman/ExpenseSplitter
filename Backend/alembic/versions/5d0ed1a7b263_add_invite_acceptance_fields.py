"""Add secure acceptance fields to invites.

Revision ID: 5d0ed1a7b263
Revises: d17e292b16f3
"""
from typing import Sequence, Union
from datetime import datetime, timedelta, timezone
import secrets

from alembic import op
import sqlalchemy as sa


revision: str = "5d0ed1a7b263"
down_revision: Union[str, Sequence[str], None] = "d17e292b16f3"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("invites", sa.Column("token", sa.String(), nullable=True))
    op.add_column("invites", sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("invites", sa.Column("accepted_at", sa.DateTime(timezone=True), nullable=True))
    # Keep the migration safe for databases that already contain pending invites.
    # Existing links did not exist, so they receive a fresh seven-day expiry.
    connection = op.get_bind()
    pending_invites = connection.execute(sa.text("SELECT id FROM invites WHERE token IS NULL")).fetchall()
    for (invite_id,) in pending_invites:
        connection.execute(
            sa.text("UPDATE invites SET token = :token, expires_at = :expires_at WHERE id = :id"),
            {
                "id": invite_id,
                "token": secrets.token_urlsafe(32),
                "expires_at": datetime.now(timezone.utc) + timedelta(days=7),
            },
        )
    op.alter_column("invites", "token", nullable=False)
    op.alter_column("invites", "expires_at", nullable=False)
    op.create_unique_constraint("uq_invites_token", "invites", ["token"])
    op.create_index("ix_invites_token", "invites", ["token"])


def downgrade() -> None:
    op.drop_index("ix_invites_token", table_name="invites")
    op.drop_constraint("uq_invites_token", "invites", type_="unique")
    op.drop_column("invites", "accepted_at")
    op.drop_column("invites", "expires_at")
    op.drop_column("invites", "token")
