import enum

from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    ForeignKey,
    TIMESTAMP,
    func,
    UUID,
    Enum,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship

from .database import Base


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
        "Attachment", back_populates="material", cascade="all, delete-orphan"
    )


class AttachmentTypeEnum(str, enum.Enum):
    file = "file"
    link = "link"


class Attachment(Base):
    __tablename__ = "attachments"

    id = Column(UUID, primary_key=True, index=True)
    path = Column(Text, nullable=False)
    name = Column(String(255), nullable=False)
    type = Column(Enum(AttachmentTypeEnum), nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    material_id = Column(Integer, ForeignKey("materials.id", ondelete="CASCADE"))
    material = relationship("Material", back_populates="attachments")


class Test(Base):
    __tablename__ = "tests"

    id = Column(Integer, primary_key=True, index=True)
    material_id = Column(Integer, ForeignKey("materials.id"))

    question = Column(String, nullable=False)
    options = Column(JSONB, nullable=False)  # ["A", "B", "C"]
    correct_answer = Column(String, nullable=False)

    material = relationship("Material", back_populates="tests")


class UserProgress(Base):
    __tablename__ = "user_progress"

    id = Column(UUID(as_uuid=True), primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    attachment_id = Column(UUID(as_uuid=True), ForeignKey("attachments.id", ondelete="CASCADE"), nullable=True)
    test_id = Column(Integer, ForeignKey("tests.id", ondelete="CASCADE"), nullable=True)

    is_completed = Column(Integer, default=0)  # 0 = bajarilmagan, 1 = bajarilgan
    completed_at = Column(TIMESTAMP(timezone=True), server_default=func.now())

    # Aloqalar
    user = relationship("User")
    attachment = relationship("Attachment")
    test = relationship("Test")


class TestSession(Base):
    __tablename__ = "test_sessions"

    id = Column(UUID(as_uuid=True), primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    total_questions = Column(Integer, nullable=False)
    correct_answers = Column(Integer, nullable=False)
    score_percentage = Column(Integer, nullable=False)  # 0-100
    test_data = Column(JSONB, nullable=False)  # Store test questions and answers
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    passed = Column(Integer, default=0)  # 0 = failed, 1 = passed (≥75%)

    # Relationships
    user = relationship("User")