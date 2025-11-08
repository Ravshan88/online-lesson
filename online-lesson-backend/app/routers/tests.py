from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from .. import models, schemas, database

router = APIRouter(
    prefix="/tests",
    tags=["tests"]
)


# --- Create test for a material ---
@router.post("/", response_model=schemas.Test)
def create_test(test: schemas.TestCreate, material_id: int, db: Session = Depends(database.get_db)):
    material = db.query(models.Material).filter(models.Material.id == material_id).first()
    if not material:
        raise HTTPException(status_code=404, detail="Material not found")

    db_test = models.Test(
        material_id=material_id,
        question=test.question,
        options=test.options,
        correct_answer=test.correct_answer,
    )
    db.add(db_test)
    db.commit()
    db.refresh(db_test)
    return db_test


# --- Get all tests ---
@router.get("/", response_model=List[schemas.Test])
def get_all_tests(db: Session = Depends(database.get_db)):
    return db.query(models.Test).all()


# --- Get tests by material ---
@router.get("/material/{material_id}", response_model=List[schemas.Test])
def get_tests_by_material(material_id: int, db: Session = Depends(database.get_db)):
    return db.query(models.Test).filter(models.Test.material_id == material_id).all()


# --- Get single test ---
@router.get("/{test_id}", response_model=schemas.Test)
def get_test(test_id: int, db: Session = Depends(database.get_db)):
    test = db.query(models.Test).filter(models.Test.id == test_id).first()
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")
    return test


# --- Update test ---
@router.put("/{test_id}", response_model=schemas.Test)
def update_test(test_id: int, updated: schemas.TestCreate, db: Session = Depends(database.get_db)):
    db_test = db.query(models.Test).filter(models.Test.id == test_id).first()
    if not db_test:
        raise HTTPException(status_code=404, detail="Test not found")

    db_test.question = updated.question
    db_test.options = updated.options
    db_test.correct_answer = updated.correct_answer

    db.commit()
    db.refresh(db_test)
    return db_test


# --- Delete test ---
@router.delete("/{test_id}")
def delete_test(test_id: int, db: Session = Depends(database.get_db)):
    db_test = db.query(models.Test).filter(models.Test.id == test_id).first()
    if not db_test:
        raise HTTPException(status_code=404, detail="Test not found")

    db.delete(db_test)
    db.commit()
    return {"message": f"Test {test_id} deleted successfully"}