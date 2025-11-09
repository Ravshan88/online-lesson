import os
import uuid
import mimetypes

from fastapi import APIRouter, Depends, HTTPException, Form, UploadFile, File, status
from sqlalchemy.orm import Session
from fastapi.responses import FileResponse
from typing import List, Optional
from .. import models, schemas, database, oauth2

router = APIRouter(prefix="/materials", tags=["materials"])

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


def get_current_admin_user(
    current_user: models.User = Depends(oauth2.get_current_user),
):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions. Admin access required.",
        )
    return current_user


# --- CREATE material + tests ---
@router.post("/", response_model=schemas.Material)
async def create_material(
    section_id: int = Form(...),
    title: Optional[str] = Form(None),
    video_type: Optional[str] = Form(None),  # "youtube" or "file"
    video_url: Optional[str] = Form(None),  # only if youtube
    pdf_file: Optional[UploadFile] = File(None),
    video_file: Optional[UploadFile] = File(None),
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_admin_user),
):
    # Material yaratish
    db_material = models.Material(
        section_id=section_id,
        title=title,
    )
    db.add(db_material)
    db.commit()
    db.refresh(db_material)

    # PDF attachment yaratish
    if pdf_file:
        pdf_path = os.path.join(UPLOAD_DIR, pdf_file.filename)
        with open(pdf_path, "wb") as buffer:
            buffer.write(await pdf_file.read())

        db_attachment = models.Attachment(
            id=uuid.uuid4(),
            path=pdf_path,
            name=pdf_file.filename,
            type=models.AttachmentTypeEnum.file,
            material_id=db_material.id,
        )
        db.add(db_attachment)

    # Video attachment yaratish
    if video_type == "file" and video_file:
        video_path = os.path.join(UPLOAD_DIR, video_file.filename)
        with open(video_path, "wb") as buffer:
            buffer.write(await video_file.read())

        db_attachment = models.Attachment(
            id=uuid.uuid4(),
            path=video_path,
            name=video_file.filename,
            type=models.AttachmentTypeEnum.file,
            material_id=db_material.id,
        )
        db.add(db_attachment)
    elif video_type == "youtube" and video_url:
        db_attachment = models.Attachment(
            id=uuid.uuid4(),
            path=video_url,
            name="YouTube Video",
            type=models.AttachmentTypeEnum.link,
            material_id=db_material.id,
        )
        db.add(db_attachment)

    db.commit()
    db.refresh(db_material)

    return db_material


# --- GET materials by section ---
@router.get("/sectionId/{section_id}", response_model=List[schemas.Material])
def get_materials_by_section(section_id: int, db: Session = Depends(database.get_db)):
    return (
        db.query(models.Material).filter(models.Material.section_id == section_id).all()
    )


# --- GET single material ---
@router.get("/{material_id}", response_model=schemas.Material)
def get_material(material_id: int, db: Session = Depends(database.get_db)):
    material = (
        db.query(models.Material).filter(models.Material.id == material_id).first()
    )
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
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_admin_user),
):
    db_material = (
        db.query(models.Material).filter(models.Material.id == material_id).first()
    )
    if not db_material:
        raise HTTPException(status_code=404, detail="Material not found")

    # PDF attachment yangilash - eski PDF attachmentlarni o'chirish
    if pdf_file:
        # Delete existing PDF attachments
        existing_pdfs = (
            db.query(models.Attachment)
            .filter(
                models.Attachment.material_id == material_id,
                models.Attachment.type == models.AttachmentTypeEnum.file,
                models.Attachment.path.like("%.pdf"),
            )
            .all()
        )
        for pdf_att in existing_pdfs:
            db.delete(pdf_att)

        # Create new PDF attachment
        pdf_path = os.path.join(UPLOAD_DIR, pdf_file.filename)
        with open(pdf_path, "wb") as buffer:
            buffer.write(await pdf_file.read())

        db_attachment = models.Attachment(
            id=uuid.uuid4(),
            path=pdf_path,
            name=pdf_file.filename,
            type=models.AttachmentTypeEnum.file,
            material_id=material_id,
        )
        db.add(db_attachment)

    # Video attachment yangilash - eski video attachmentlarni o'chirish
    if video_type:
        # Delete existing video attachments (both file and link types for videos)
        existing_videos = (
            db.query(models.Attachment)
            .filter(
                models.Attachment.material_id == material_id,
                models.Attachment.type == models.AttachmentTypeEnum.link,
            )
            .all()
        )
        # Also check for video files
        video_files = (
            db.query(models.Attachment)
            .filter(
                models.Attachment.material_id == material_id,
                models.Attachment.type == models.AttachmentTypeEnum.file,
                models.Attachment.path.like("%.mp4")
                | models.Attachment.path.like("%.avi")
                | models.Attachment.path.like("%.mov")
                | models.Attachment.path.like("%.mkv"),
            )
            .all()
        )
        for vid_att in existing_videos + video_files:
            db.delete(vid_att)

        if video_type == "file" and video_file:
            video_path = os.path.join(UPLOAD_DIR, video_file.filename)
            with open(video_path, "wb") as buffer:
                buffer.write(await video_file.read())

            db_attachment = models.Attachment(
                id=uuid.uuid4(),
                path=video_path,
                name=video_file.filename,
                type=models.AttachmentTypeEnum.file,
                material_id=material_id,
            )
            db.add(db_attachment)
        elif video_type == "youtube" and video_url:
            db_attachment = models.Attachment(
                id=uuid.uuid4(),
                path=video_url,
                name="YouTube Video",
                type=models.AttachmentTypeEnum.link,
                material_id=material_id,
            )
            db.add(db_attachment)

    db_material.section_id = section_id
    if title:
        db_material.title = title
    db.commit()
    db.refresh(db_material)
    return db_material


# --- DELETE material ---
@router.delete("/{material_id}")
def delete_material(
    material_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_admin_user),
):
    db_material = (
        db.query(models.Material).filter(models.Material.id == material_id).first()
    )
    if not db_material:
        raise HTTPException(status_code=404, detail="Material not found")

    db.delete(db_material)
    db.commit()
    return {"message": f"Material {material_id} deleted successfully"}


@router.get("/get_pdf/{material_id}")
def get_material_pdf(material_id: int, db: Session = Depends(database.get_db)):
    print("pdf endpoint")
    material = (
        db.query(models.Material).filter(models.Material.id == material_id).first()
    )
    if not material:
        raise HTTPException(status_code=404, detail="Material not found")

    # Find PDF attachment
    pdf_attachment = (
        db.query(models.Attachment)
        .filter(
            models.Attachment.material_id == material_id,
            models.Attachment.type == models.AttachmentTypeEnum.file,
            models.Attachment.path.like("%.pdf"),
        )
        .first()
    )

    if not pdf_attachment:
        raise HTTPException(status_code=404, detail="PDF not found")

    file_path = pdf_attachment.path.replace("\\", "/")

    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail=f"File not found: {file_path}")
    print(file_path, os.path.basename(file_path))
    return FileResponse(
        path=file_path,
        media_type="application/pdf",
        filename=os.path.basename(file_path),
    )


@router.get("/get_file/{attachment_id}")
def get_file_by_attachment_id(
    attachment_id: str, db: Session = Depends(database.get_db)
):
    """Download any file attachment by its ID"""
    try:
        # Convert string to UUID for proper comparison
        attachment_uuid = uuid.UUID(attachment_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid attachment ID format")

    attachment = (
        db.query(models.Attachment)
        .filter(models.Attachment.id == attachment_uuid)
        .first()
    )

    if not attachment:
        raise HTTPException(status_code=404, detail="Attachment not found")

    if attachment.type != models.AttachmentTypeEnum.file:
        raise HTTPException(status_code=400, detail="Attachment is not a file")

    file_path = attachment.path.replace("\\", "/")

    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail=f"File not found: {file_path}")

    # Determine media type based on file extension
    media_type, _ = mimetypes.guess_type(file_path)
    if not media_type:
        media_type = "application/octet-stream"

    return FileResponse(
        path=file_path,
        media_type=media_type,
        filename=attachment.name or os.path.basename(file_path),
    )
