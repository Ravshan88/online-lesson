from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List
import uuid
import random
import os
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.units import inch
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import Paragraph, Frame

from .. import models, schemas, database, oauth2

router = APIRouter(prefix="/test-sessions", tags=["test-sessions"])


@router.post("/start", response_model=schemas.TestSessionStart)
def start_test_session(
    session_data: schemas.TestSessionCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(oauth2.get_current_user),
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
            detail="Siz allaqachon yakuniy testni topshirgansiz. Faqat bir marta topshirish mumkin.",
        )

    # Get all available tests from the database
    all_tests = db.query(models.Test).all()

    if len(all_tests) == 0:
        raise HTTPException(status_code=400, detail="Hozircha testlar mavjud emas")

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

        questions.append({"id": test.id, "question": test.question, "options": options})

        test_mapping[str(test.id)] = {
            "correct_answer": test.correct_answer,
            "question": test.question,
            "material_id": test.material_id,
        }

    # Create a temporary session ID (we'll save results when submitted)
    session_id = uuid.uuid4()

    # Store session data temporarily in cache or return it
    # For now, we'll return the session_id and questions
    # The test_mapping will be reconstructed when checking answers

    return {"session_id": session_id, "questions": questions}


@router.post("/submit", response_model=schemas.TestSessionResult)
def submit_test_session(
    submission: schemas.TestSessionSubmit,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(oauth2.get_current_user),
):
    """
    Submit test session answers and save results.
    """
    session_id = submission.session_id
    answers = submission.answers
    question_ids = submission.question_ids

    # Get ALL tests that were in the session (not just answered ones)
    tests = db.query(models.Test).filter(models.Test.id.in_(question_ids)).all()

    if not tests:
        raise HTTPException(status_code=404, detail="Tests not found")

    # Create a mapping of test_id to test object
    test_map = {test.id: test for test in tests}

    # Check answers and calculate score for ALL questions
    results = []
    correct_count = 0

    # Process ALL questions in the session
    for test in tests:
        user_answer = answers.get(str(test.id))  # May be None if not answered
        is_correct = user_answer == test.correct_answer if user_answer else False

        if is_correct:
            correct_count += 1

        results.append(
            {
                "test_id": test.id,
                "question": test.question,
                "user_answer": user_answer,
                "correct_answer": test.correct_answer,
                "is_correct": is_correct,
                "material_id": test.material_id,
            }
        )

    # Total questions is ALL questions in the session, not just answered ones
    total_questions = len(tests)
    score_percentage = (
        int((correct_count / total_questions) * 100) if total_questions > 0 else 0
    )

    # Determine if user passed (≥60%)
    PASSING_THRESHOLD = 60
    passed = 1 if score_percentage >= PASSING_THRESHOLD else 0

    # Save test session to database
    test_session = models.TestSession(
        id=session_id,
        user_id=current_user.id,
        total_questions=total_questions,
        correct_answers=correct_count,
        score_percentage=score_percentage,
        passed=passed,
        test_data={"results": results, "submitted_at": datetime.utcnow().isoformat()},
        created_at=datetime.utcnow(),
    )

    db.add(test_session)
    db.commit()
    db.refresh(test_session)

    return test_session


@router.get("/history", response_model=schemas.TestSessionHistory)
def get_test_history(
    limit: int = 10,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(oauth2.get_current_user),
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

    return {"sessions": sessions, "total_sessions": len(sessions)}


@router.get("/{session_id}", response_model=schemas.TestSessionResult)
def get_test_session(
    session_id: str,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(oauth2.get_current_user),
):
    """
    Get a specific test session result.
    """
    session = (
        db.query(models.TestSession)
        .filter(
            models.TestSession.id == session_id,
            models.TestSession.user_id == current_user.id,
        )
        .first()
    )

    if not session:
        raise HTTPException(status_code=404, detail="Test session not found")

    return session


@router.get("/check/status")
def check_test_status(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(oauth2.get_current_user),
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
        "existing_session_id": str(existing_session.id) if existing_session else None,
    }


@router.get("/certificate/{session_id}")
def generate_certificate(
    session_id: str,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(oauth2.get_current_user),
):
    """
    Generate a PDF certificate for the test session.
    """
    # Get the test session
    session = (
        db.query(models.TestSession)
        .filter(
            models.TestSession.id == session_id,
            models.TestSession.user_id == current_user.id,
        )
        .first()
    )

    if not session:
        raise HTTPException(status_code=404, detail="Test session not found")

    # Check if user passed (≥60%)
    if session.passed != 1:
        raise HTTPException(
            status_code=403,
            detail="Sertifikat olish uchun kamida 60% ball to'plash kerak",
        )

    # Create certificates directory if it doesn't exist
    cert_dir = "certificates"
    os.makedirs(cert_dir, exist_ok=True)

    # Generate PDF filename
    pdf_filename = f"{cert_dir}/certificate_{session_id}.pdf"

    # Create PDF
    c = canvas.Canvas(pdf_filename, pagesize=A4)
    width, height = A4

    # Set colors and fonts
    c.setFillColor(colors.HexColor("#012c6e"))  # Dark blue

    # Draw border
    c.setStrokeColor(colors.HexColor("#faad14"))  # Gold
    c.setLineWidth(3)
    c.rect(30, 30, width - 60, height - 60, stroke=1, fill=0)

    # Draw inner border
    c.setStrokeColor(colors.HexColor("#012c6e"))
    c.setLineWidth(1)
    c.rect(40, 40, width - 80, height - 80, stroke=1, fill=0)

    # Title
    c.setFont("Helvetica-Bold", 36)
    c.setFillColor(colors.HexColor("#012c6e"))
    c.drawCentredString(width / 2, height - 120, "SERTIFIKAT")

    # Subtitle
    c.setFont("Helvetica", 16)
    c.setFillColor(colors.HexColor("#666666"))
    c.drawCentredString(width / 2, height - 150, "Yakuniy Test Natijalari")

    # Horizontal line
    c.setStrokeColor(colors.HexColor("#faad14"))
    c.setLineWidth(2)
    c.line(100, height - 170, width - 100, height - 170)

    # Certificate text
    c.setFont("Helvetica", 14)
    c.setFillColor(colors.black)

    # "This certifies that"
    c.drawCentredString(
        width / 2, height - 220, "Ushbu sertifikat quyidagi shaxsga beriladi:"
    )

    # User name
    c.setFont("Helvetica-Bold", 24)
    c.setFillColor(colors.HexColor("#012c6e"))
    full_name = f"{current_user.firstname} {current_user.lastname}"
    c.drawCentredString(width / 2, height - 270, full_name)

    # Achievement text
    c.setFont("Helvetica", 14)
    c.setFillColor(colors.black)
    c.drawCentredString(
        width / 2, height - 320, "Yakuniy testni muvaffaqiyatli yakunladi"
    )

    # Test results box
    c.setFillColor(colors.HexColor("#f0f0f0"))
    c.rect(150, height - 450, width - 300, 100, stroke=0, fill=1)

    # Results
    c.setFont("Helvetica-Bold", 16)
    c.setFillColor(colors.HexColor("#012c6e"))
    c.drawCentredString(width / 2, height - 380, "Natijalar:")

    c.setFont("Helvetica", 14)
    c.setFillColor(colors.black)
    result_text = (
        f"To'g'ri javoblar: {session.correct_answers} / {session.total_questions}"
    )
    c.drawCentredString(width / 2, height - 410, result_text)

    score_text = f"Natija: {session.score_percentage}%"
    c.setFont("Helvetica-Bold", 16)
    score_color = (
        "#52c41a"
        if session.score_percentage >= 70
        else "#faad14" if session.score_percentage >= 50 else "#ff4d4f"
    )
    c.setFillColor(colors.HexColor(score_color))
    c.drawCentredString(width / 2, height - 435, score_text)

    # Date
    c.setFont("Helvetica", 12)
    c.setFillColor(colors.black)
    date_str = session.created_at.strftime("%d.%m.%Y")
    c.drawCentredString(width / 2, height - 500, f"Sana: {date_str}")

    # Footer
    c.setFont("Helvetica-Oblique", 10)
    c.setFillColor(colors.HexColor("#666666"))
    c.drawCentredString(width / 2, 80, "Online Ta'lim Platformasi")
    c.drawCentredString(width / 2, 60, "www.online-lesson.uz")

    # Logo placeholder (you can add actual logo if available)
    c.setFont("Helvetica-Bold", 20)
    c.setFillColor(colors.HexColor("#faad14"))
    c.drawCentredString(width / 2, height - 80, "OXU")

    # Save PDF
    c.save()

    # Return the PDF file
    return FileResponse(
        pdf_filename,
        media_type="application/pdf",
        filename=f"certificate_{full_name.replace(' ', '_')}.pdf",
    )
