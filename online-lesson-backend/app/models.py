import enum

from sqlalchemy import (
    Column,
    Integer,
    String,
    Enum,
    Text,
    ForeignKey,
    TIMESTAMP,
    func,
    UUID,
    Table,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship

from .database import Base

material_attachments = Table(
    "material_attachments",
    Base.metadata,
    Column("material_id", Integer, ForeignKey("materials.id", ondelete="CASCADE"), primary_key=True),
    Column("attachment_id", UUID, ForeignKey("attachments.id", ondelete="CASCADE"), primary_key=True)
)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    firstname = Column(String, nullable=False)
    lastname = Column(String, nullable=False)
    username = Column(String, nullable=False, unique=True)
    password = Column(String, nullable=False)
    role = Column(String, nullable=False)


class Section(Base):
    __tablename__ = "sections"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False)

    materials = relationship("Material", back_populates="section")


class Material(Base):
    __tablename__ = "materials"

    id = Column(Integer, primary_key=True, index=True)
    section_id = Column(Integer, ForeignKey("sections.id", ondelete="CASCADE"))
    title = Column(String, nullable=False, unique=True)
    section = relationship("Section", back_populates="materials")
    tests = relationship(
        "Test", back_populates="material", cascade="all, delete-orphan"
    )
    attachments = relationship(
        "Attachment",
        secondary=material_attachments,
        back_populates="materials"
    )


class AttachmentTypeEnum(str, enum.Enum):
    file = "file"
    link = "link"


class Attachment(Base):
    __tablename__ = "attachments"

    id = Column(UUID, primary_key=True, index=True)
    path = Column(Text, nullable=False)
    name = Column(String(255), nullable=False)
    type = Column(AttachmentTypeEnum, nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())

    materials = relationship(
        "Material",
        secondary=material_attachments,
        back_populates="attachments"
    )


class Test(Base):
    __tablename__ = "tests"

    id = Column(Integer, primary_key=True, index=True)
    material_id = Column(Integer, ForeignKey("materials.id"))

    question = Column(String, nullable=False)
    options = Column(JSONB, nullable=False)  # ["A", "B", "C"]
    correct_answer = Column(String, nullable=False)

    material = relationship("Material", back_populates="tests")
