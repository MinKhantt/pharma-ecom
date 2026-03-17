import asyncio
from app.db.database import async_session_maker
from app.models.user import User
from app.core.security import hash_password


async def create_admin():
    async with async_session_maker() as db:
        admin = User(
            full_name="Admin",
            email="admin@pharmacy.com",
            hashed_password=hash_password("admin1234"),
            is_active=True,
            is_superuser=True,
            is_profile_complete=True,
        )
        db.add(admin)
        await db.commit()
        print("Admin created successfully")


if __name__ == "__main__":
    asyncio.run(create_admin())

# eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJiNTNkMGEzNi1mMTE0LTQyOWEtYmFlYS01MGVjNGI2NDI4YjQiLCJleHAiOjE3NzM3MzQwOTl9.EpNm2GLHczF59AtBvWWZHHFAD5GygZZaKdmJM4WeRuA