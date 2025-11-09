from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List
import uuid
import random

from .. import models, schemas, database, oauth2

router = APIRouter(
    prefix="/test-sessions",
    tags=["test-sessions"]
)


@router.post("/start", response_model=schemas.TestSessionStart)
def start_test_session(
    session_data: schemas.TestSessionCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(oauth2.get_current_user)
):
    """
    Start a new test session with random questions.
    Returns a session ID and the list of questions (without correct answers).
    User can only take the test once.
    """
    # Check if user has already taken the test
    existing_session = (
        db.query(models.TestSession)
        .filter(models.TestSession.user_id == current_user.id)
        .first()
    )
    
    if existing_session:
        raise HTTPException(
            status_code=400,
            detail="Siz allaqachon yakuniy testni topshirgansiz. Faqat bir marta topshirish mumkin."
        )
    
    # Get all available tests from the database
    all_tests = db.query(models.Test).all()
    
    if len(all_tests) == 0:
        raise HTTPException(
            status_code=400,
            detail="Hozircha testlar mavjud emas"
        )
    
    # Use minimum of 30 or all available tests
    num_questions = min(30, len(all_tests))
    
    # Randomly select tests
    selected_tests = random.sample(all_tests, num_questions)
    
    # Shuffle the order
    random.shuffle(selected_tests)
    
    # Prepare questions for frontend (without correct answers)
    questions = []
    test_mapping = {}  # Store test_id -> correct_answer mapping
    
    for test in selected_tests:
        # Shuffle options for each question
        options = test.options.copy()
        random.shuffle(options)
        
        questions.append({
            "id": test.id,
            "question": test.question,
            "options": options
        })
        
        test_mapping[str(test.id)] = {
            "correct_answer": test.correct_answer,
            "question": test.question,
            "material_id": test.material_id
        }
    
    # Create a temporary session ID (we'll save results when submitted)
    session_id = uuid.uuid4()
    
    # Store session data temporarily in cache or return it
    # For now, we'll return the session_id and questions
    # The test_mapping will be reconstructed when checking answers
    
    return {
        "session_id": session_id,
        "questions": questions
    }


@router.post("/submit", response_model=schemas.TestSessionResult)
def submit_test_session(
    submission: schemas.TestSessionSubmit,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(oauth2.get_current_user)
):
    """
    Submit test session answers and save results.
    """
    session_id = submission.session_id
    answers = submission.answers
    
    # Get the tests from the database based on submitted test IDs
    test_ids = [int(tid) for tid in answers.keys()]
    tests = db.query(models.Test).filter(models.Test.id.in_(test_ids)).all()
    
    if not tests:
        raise HTTPException(status_code=404, detail="Tests not found")
    
    # Create a mapping of test_id to test object
    test_map = {test.id: test for test in tests}
    
    # Check answers and calculate score
    results = []
    correct_count = 0
    
    for test_id_str, user_answer in answers.items():
        test_id = int(test_id_str)
        test = test_map.get(test_id)
        
        if not test:
            continue
        
        is_correct = user_answer == test.correct_answer
        
        if is_correct:
            correct_count += 1
        
        results.append({
            "test_id": test_id,
            "question": test.question,
            "user_answer": user_answer,
            "correct_answer": test.correct_answer,
            "is_correct": is_correct,
            "material_id": test.material_id
        })
    
    total_questions = len(tests)
    score_percentage = int((correct_count / total_questions) * 100) if total_questions > 0 else 0
    
    # Save test session to database
    test_session = models.TestSession(
        id=session_id,
        user_id=current_user.id,
        total_questions=total_questions,
        correct_answers=correct_count,
        score_percentage=score_percentage,
        test_data={
            "results": results,
            "submitted_at": datetime.utcnow().isoformat()
        },
        created_at=datetime.utcnow()
    )
    
    db.add(test_session)
    db.commit()
    db.refresh(test_session)
    
    return test_session


@router.get("/history", response_model=schemas.TestSessionHistory)
def get_test_history(
    limit: int = 10,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(oauth2.get_current_user)
):
    """
    Get user's test session history.
    """
    sessions = (
        db.query(models.TestSession)
        .filter(models.TestSession.user_id == current_user.id)
        .order_by(models.TestSession.created_at.desc())
        .limit(limit)
        .all()
    )
    
    return {
        "sessions": sessions,
        "total_sessions": len(sessions)
    }


@router.get("/{session_id}", response_model=schemas.TestSessionResult)
def get_test_session(
    session_id: str,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(oauth2.get_current_user)
):
    """
    Get a specific test session result.
    """
    session = (
        db.query(models.TestSession)
        .filter(
            models.TestSession.id == session_id,
            models.TestSession.user_id == current_user.id
        )
        .first()
    )
    
    if not session:
        raise HTTPException(status_code=404, detail="Test session not found")
    
    return session


@router.get("/check/status")
def check_test_status(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(oauth2.get_current_user)
):
    """
    Check if user has already taken the test and get available test count.
    """
    # Check if user has already taken the test
    existing_session = (
        db.query(models.TestSession)
        .filter(models.TestSession.user_id == current_user.id)
        .first()
    )
    
    # Get total available tests
    total_tests = db.query(models.Test).count()
    
    # Calculate how many questions will be in the test
    test_question_count = min(30, total_tests)
    
    return {
        "has_taken_test": existing_session is not None,
        "total_available_tests": total_tests,
        "test_question_count": test_question_count,
        "existing_session_id": str(existing_session.id) if existing_session else None
    }

