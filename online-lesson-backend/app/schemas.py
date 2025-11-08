from typing import Optional, List

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
# Material schemas
# =========================
class MaterialBase(BaseModel):
    title: Optional[str]
    pdf_path: Optional[str] = None
    video_type: Optional[str] = None  # "youtube" or "file"
    video_url: Optional[str] = None


class MaterialCreate(MaterialBase):
    section_id: int
    tests: List[TestCreate] = []  # material yaratilganda testlar ham kiritilishi mumkin


class Material(MaterialBase):
    id: int
    section_id: int
    tests: List[Test] = []  # bog‘langan testlar chiqadi

    class Config:
        orm_mode = True


class SectionBase(BaseModel):
    name: str


class Section(SectionBase):
    id: int
    materials: int

    class Config:
        from_attributes = True
