from typing import Optional, List
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class UserCreate(BaseModel):
    firstname: str
    lastname: str
    username: str
    password: str


class UserOut(BaseModel):
    id: int
    username: str
    firstname: str
    lastname: str
    role: str

    class Config:
        from_attributes = True


class UserLogin(BaseModel):
    username: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    id: Optional[int] = None
    role: Optional[str] = None


# Section schemas
# =========================
# Test schemas
# =========================
class TestBase(BaseModel):
    material_id: int
    question: str
    options: List[str]
    correct_answer: str


class TestCreate(TestBase):
    pass


class Test(TestBase):
    id: int

    class Config:
        from_attributes = True


# =========================
# Attachment schemas
# =========================
class AttachmentBase(BaseModel):
    path: str
    name: str
    type: str  # "file" or "link"


class AttachmentCreate(AttachmentBase):
    material_id: int


class Attachment(AttachmentBase):
    id: UUID
    material_id: int
    created_at: datetime

    class Config:
        from_attributes = True


# =========================
# Material schemas
# =========================
class MaterialBase(BaseModel):
    title: Optional[str]


class MaterialCreate(MaterialBase):
    section_id: int
    tests: List[TestCreate] = []  # material yaratilganda testlar ham kiritilishi mumkin


class Material(MaterialBase):
    id: int
    section_id: int
    tests: List[Test] = []  # bog‘langan testlar chiqadi
    attachments: List[Attachment] = []  # bog‘langan attachmentlar chiqadi

    class Config:
        from_attributes = True


class SectionBase(BaseModel):
    name: str


class Section(SectionBase):
    id: int
    materials: int

    class Config:
        from_attributes = True


class ProgressBase(BaseModel):
    user_id: int
    attachment_id: Optional[UUID] = None
    test_id: Optional[int] = None


class ProgressCreate(ProgressBase):
    pass


class ProgressResponse(ProgressBase):
    id: int
    is_completed: bool
    completed_at: Optional[datetime]

    class Config:
        from_attributes = True


class TestSubmission(BaseModel):
    material_id: int
    answers: dict  # {test_id: selected_answer}


class MaterialProgressResponse(BaseModel):
    material_id: int
    pdf_completed: bool
    pdf_attachment_id: Optional[UUID] = None
    video_completed: bool
    video_attachment_id: Optional[UUID] = None
    total_tests: int
    completed_tests: int
    test_progress: List[dict]
    percentage: float


# =========================
# Test Session schemas
# =========================
class TestSessionCreate(BaseModel):
    num_questions: int = 30  # Default to 30 questions


class TestSessionStart(BaseModel):
    session_id: UUID
    questions: List[dict]  # List of questions with id, question, options


class TestSessionSubmit(BaseModel):
    session_id: UUID
    answers: dict  # {test_id: selected_answer}
    question_ids: List[int]  # All question IDs in the test session


class TestSessionResult(BaseModel):
    id: UUID
    user_id: int
    total_questions: int
    correct_answers: int
    score_percentage: int
    passed: int  # 0 = failed, 1 = passed
    test_data: dict
    created_at: datetime

    class Config:
        from_attributes = True


class TestSessionHistory(BaseModel):
    sessions: List[TestSessionResult]
    total_sessions: int
