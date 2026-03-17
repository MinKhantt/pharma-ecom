import uuid
from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass


def gen_uuid():
    return uuid.uuid4()
