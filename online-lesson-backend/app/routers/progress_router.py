from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List, Optional
from uuid import UUID
import uuid

from .. import models, schemas, database, oauth2

router = APIRouter(
    prefix="/progress",
    tags=["progress"]
)


@router.post("/complete")
def mark_progress_complete(
        data: schemas.ProgressCreate,
        db: Session = Depends(database.get_db),
        current_user: models.User = Depends(oauth2.get_current_user)
):
    """Mark attachment or test as completed for current user"""
    if not data.attachment_id and not data.test_id:
        raise HTTPException(status_code=400, detail="attachment_id yoki test_id bo'lishi kerak")

    # Use current user's ID instead of data.user_id for security
    user_id = current_user.id

    progress = (
        db.query(models.UserProgress)
        .filter(
            models.UserProgress.user_id == user_id,
            models.UserProgress.attachment_id == data.attachment_id,
            models.UserProgress.test_id == data.test_id
        )
        .first()
    )

    if progress:
        progress.is_completed = 1
        progress.completed_at = datetime.utcnow()
    else:
        progress = models.UserProgress(
            id=uuid.uuid4(),
            user_id=user_id,
            attachment_id=data.attachment_id,
            test_id=data.test_id,
            is_completed=1,
            completed_at=datetime.utcnow()
        )
        db.add(progress)

    db.commit()
    db.refresh(progress)
    return progress


@router.post("/submit-test")
def submit_test(
        submission: schemas.TestSubmission,
        db: Session = Depends(database.get_db),
        current_user: models.User = Depends(oauth2.get_current_user)
):
    """Submit test answers and mark correct ones as completed"""
    user_id = current_user.id
    material_id = submission.material_id
    answers = submission.answers
    
    # Get all tests for the material
    tests = db.query(models.Test).filter(models.Test.material_id == material_id).all()
    
    if not tests:
        raise HTTPException(status_code=404, detail="Material not found or has no tests")
    
    results = []
    correct_count = 0
    
    for test in tests:
        user_answer = answers.get(str(test.id))
        is_correct = user_answer == test.correct_answer
        
        if is_correct:
            correct_count += 1
            # Mark test as completed
            progress = (
                db.query(models.UserProgress)
                .filter(
                    models.UserProgress.user_id == user_id,
                    models.UserProgress.test_id == test.id
                )
                .first()
            )
            
            if not progress:
                progress = models.UserProgress(
                    id=uuid.uuid4(),
                    user_id=user_id,
                    test_id=test.id,
                    is_completed=1,
                    completed_at=datetime.utcnow()
                )
                db.add(progress)
            elif progress.is_completed == 0:
                progress.is_completed = 1
                progress.completed_at = datetime.utcnow()
        
        results.append({
            "test_id": test.id,
            "question": test.question,
            "user_answer": user_answer,
            "correct_answer": test.correct_answer,
            "is_correct": is_correct
        })
    
    db.commit()
    
    return {
        "total_tests": len(tests),
        "correct_count": correct_count,
        "results": results
    }


@router.get("/material/{material_id}", response_model=schemas.MaterialProgressResponse)
def get_material_progress(
        material_id: int,
        db: Session = Depends(database.get_db),
        current_user: models.User = Depends(oauth2.get_current_user)
):
    """Get user's progress for a specific material"""
    user_id = current_user.id
    
    # Get material
    material = db.query(models.Material).filter(models.Material.id == material_id).first()
    if not material:
        raise HTTPException(status_code=404, detail="Material not found")
    
    # Get all attachments (PDF and video)
    pdf_attachment = None
    video_attachment = None
    
    for att in material.attachments:
        if att.type == models.AttachmentTypeEnum.file and att.path.lower().endswith('.pdf'):
            pdf_attachment = att
        elif att.type == models.AttachmentTypeEnum.link or (
            att.type == models.AttachmentTypeEnum.file and 
            any(att.path.lower().endswith(ext) for ext in ['.mp4', '.avi', '.mov', '.mkv'])
        ):
            video_attachment = att
    
    # Get progress for attachments
    pdf_completed = False
    video_completed = False
    
    if pdf_attachment:
        pdf_progress = (
            db.query(models.UserProgress)
            .filter(
                models.UserProgress.user_id == user_id,
                models.UserProgress.attachment_id == pdf_attachment.id,
                models.UserProgress.is_completed == 1
            )
            .first()
        )
        pdf_completed = pdf_progress is not None
    
    if video_attachment:
        video_progress = (
            db.query(models.UserProgress)
            .filter(
                models.UserProgress.user_id == user_id,
                models.UserProgress.attachment_id == video_attachment.id,
                models.UserProgress.is_completed == 1
            )
            .first()
        )
        video_completed = video_progress is not None
    
    # Get progress for tests
    total_tests = len(material.tests)
    completed_tests = 0
    
    test_progress_list = []
    for test in material.tests:
        test_progress = (
            db.query(models.UserProgress)
            .filter(
                models.UserProgress.user_id == user_id,
                models.UserProgress.test_id == test.id,
                models.UserProgress.is_completed == 1
            )
            .first()
        )
        if test_progress:
            completed_tests += 1
        test_progress_list.append({
            "test_id": test.id,
            "completed": test_progress is not None
        })
    
    # Calculate percentage
    total_items = 0
    completed_items = 0
    
    if pdf_attachment:
        total_items += 1
        if pdf_completed:
            completed_items += 1
    
    if video_attachment:
        total_items += 1
        if video_completed:
            completed_items += 1
    
    total_items += total_tests
    completed_items += completed_tests
    
    percentage = (completed_items / total_items * 100) if total_items > 0 else 0
    
    return {
        "material_id": material_id,
        "pdf_completed": pdf_completed,
        "pdf_attachment_id": pdf_attachment.id if pdf_attachment else None,
        "video_completed": video_completed,
        "video_attachment_id": video_attachment.id if video_attachment else None,
        "total_tests": total_tests,
        "completed_tests": completed_tests,
        "test_progress": test_progress_list,
        "percentage": round(percentage, 2)
    }
