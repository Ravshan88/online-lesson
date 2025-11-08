from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from .. import models, schemas, database

router = APIRouter(prefix="/sections", tags=["sections"])


@router.get("/", response_model=List[schemas.Section])
def get_sections(db: Session = Depends(database.get_db)):
    sections = db.query(
        models.Section.id, models.Section.name,
        func.count(models.Material.id).label("materials")
    ).outerjoin(models.Material, models.Material.section_id == models.Section.id).group_by(models.Section.id).order_by(
        models.Section.id).all()

    return [
        {"id": s.id, "name": s.name, "materials": s.materials}
        for s in sections
    ]


@router.get("/{section_id}", response_model=schemas.Section)
def get_section_by_id(section_id: str, db: Session = Depends(database.get_db)):
    try:
        return db.query(models.Section).filter(models.Section.id == section_id).first()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {e}.")
