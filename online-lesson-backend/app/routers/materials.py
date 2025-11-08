import os

from fastapi import APIRouter, Depends, HTTPException, Form, UploadFile, File
from sqlalchemy.orm import Session
from fastapi.responses import FileResponse
from typing import List, Optional
from .. import models, schemas, database

router = APIRouter(
    prefix="/materials",
    tags=["materials"]
)

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


# --- CREATE material + tests ---
@router.post("/", response_model=schemas.Material)
async def create_material(
        section_id: int = Form(...),
        title: Optional[str] = Form(None),
        video_type: Optional[str] = Form(None),  # "youtube" or "file"
        video_url: Optional[str] = Form(None),  # only if youtube
        pdf_file: Optional[UploadFile] = File(None),
        video_file: Optional[UploadFile] = File(None),
        db: Session = Depends(database.get_db)
):
    pdf_path = None
    video_path = None

    # PDF saqlash
    if pdf_file:
        pdf_path = os.path.join(UPLOAD_DIR, pdf_file.filename)
        with open(pdf_path, "wb") as buffer:
            buffer.write(await pdf_file.read())

    # Video saqlash (faqat file bo‘lsa)
    if video_type == "file" and video_file:
        video_path = os.path.join(UPLOAD_DIR, video_file.filename)
        with open(video_path, "wb") as buffer:
            buffer.write(await video_file.read())

    # Material yaratish
    db_material = models.Material(
        section_id=section_id,
        title=title,
        pdf_path=pdf_path,
        video_type=video_type,
        video_url=video_url if video_type == "youtube" else video_path,
    )
    db.add(db_material)
    db.commit()
    db.refresh(db_material)

    return db_material


# --- GET materials by section ---
@router.get("/sectionId/{section_id}", response_model=List[schemas.Material])
def get_materials_by_section(section_id: int, db: Session = Depends(database.get_db)):
    return db.query(models.Material).filter(models.Material.section_id == section_id).all()


# --- GET single material ---
@router.get("/{material_id}", response_model=schemas.Material)
def get_material(material_id: int, db: Session = Depends(database.get_db)):
    material = db.query(models.Material).filter(models.Material.id == material_id).first()
    if not material:
        raise HTTPException(status_code=404, detail="Material not found")
    return material


@router.put("/{material_id}", response_model=schemas.Material)
async def update_material(
        material_id: int,
        section_id: int = Form(...),
        title: Optional[str] = Form(None),
        video_type: Optional[str] = Form(None),
        video_url: Optional[str] = Form(None),
        pdf_file: Optional[UploadFile] = File(None),
        video_file: Optional[UploadFile] = File(None),
        db: Session = Depends(database.get_db)
):
    db_material = db.query(models.Material).filter(models.Material.id == material_id).first()
    if not db_material:
        raise HTTPException(status_code=404, detail="Material not found")

    # PDF yangilash
    if pdf_file:
        pdf_path = os.path.join(UPLOAD_DIR, pdf_file.filename)
        with open(pdf_path, "wb") as buffer:
            buffer.write(await pdf_file.read())
        db_material.pdf_path = pdf_path

    # Video yangilash
    if video_type == "file" and video_file:
        video_path = os.path.join(UPLOAD_DIR, video_file.filename)
        with open(video_path, "wb") as buffer:
            buffer.write(await video_file.read())
        db_material.video_url = video_path
        db_material.video_type = "file"
    elif video_type == "youtube" and video_url:
        db_material.video_url = video_url
        db_material.video_type = "youtube"

    db_material.section_id = section_id
    db_material.title = title
    db.commit()
    db.refresh(db_material)
    return db_material


# --- DELETE material ---
@router.delete("/{material_id}")
def delete_material(material_id: int, db: Session = Depends(database.get_db)):
    db_material = db.query(models.Material).filter(models.Material.id == material_id).first()
    if not db_material:
        raise HTTPException(status_code=404, detail="Material not found")

    db.delete(db_material)
    db.commit()
    return {"message": f"Material {material_id} deleted successfully"}


@router.get("/get_pdf/{material_id}")
def get_material_pdf(material_id: int, db: Session = Depends(database.get_db)):
    print("pdf endpoint")
    material = db.query(models.Material).filter(models.Material.id == material_id).first()
    if not material or not material.pdf_path:
        raise HTTPException(status_code=404, detail="PDF not found")

    file_path = material.pdf_path.replace("\\", "/")

    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail=f"File not found: {file_path}")
    print(file_path, os.path.basename(file_path))
    return FileResponse(
        path=file_path,
        media_type="application/pdf",
        filename=os.path.basename(file_path)
    )
