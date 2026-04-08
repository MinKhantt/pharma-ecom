import asyncio
from app.db.database import async_session_maker
from app.models.user import User
from app.core.security import hash_password
from app.core.config import settings


async def create_admin():
    async with async_session_maker() as db:
        admin = User(
            full_name=settings.ADMIN_FULL_NAME,
            email=settings.ADMIN_EMAIL,
            hashed_password=hash_password(settings.ADMIN_PASSWORD),
            is_active=True,
            is_superuser=True,
            is_profile_complete=True,
        )
        db.add(admin)
        await db.commit()
        print("Admin created successfully")


if __name__ == "__main__":
    asyncio.run(create_admin())
