"""add return_requested to orderstatus

Revision ID: 9054e5d75974
Revises: 3b25cf37b9fa
Create Date: 2026-03-23 11:03:38.868796

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '9054e5d75974'
down_revision: Union[str, Sequence[str], None] = '3b25cf37b9fa'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.execute("ALTER TYPE orderstatus ADD VALUE IF NOT EXISTS 'RETURN_REQUESTED'")


def downgrade() -> None:
    """Downgrade schema."""
    pass
