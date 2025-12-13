from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from . import models
from .database import engine, get_db
from .routers import user, auth, sections, materials, test, progress_router, test_sessions

models.Base.metadata.create_all(bind=engine)
app = FastAPI()


@app.get("/")
def root():
    return {"Hello": "World"}


origins = ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(user.router)
app.include_router(auth.router)
app.include_router(sections.router)
app.include_router(materials.router)
app.include_router(test.router)
app.include_router(progress_router.router)
app.include_router(test_sessions.router)


# Seed default sections on startup if empty
@app.on_event("startup")
def seed_sections():
    from .models import Section
    from .database import SessionLocal

    db = SessionLocal()
    admin = db.query(models.User).filter(models.User.role == 'admin').first()
    if not admin:
        new_admin = models.User(
            username="admin",
            firstname="admin",
            lastname="admin",
            role="admin",
            password="admin123"
        )
        db.add(new_admin)
        db.commit()
    try:
        count = db.query(Section).count()
        if count == 0:
            defaults = [
                {"name": "Maruza"},
                {"name": "Amaliy"},
                {"name": "Tajriba"},
                {"name": "Mustaqil Ish"},
                {"name": "Yakuniy Test"}
            ]
            for data in defaults:
                db.add(Section(**data))
            db.commit()
        else:
            # Check if "Yakuniy Test" exists, if not add it
            yakuniy_test = db.query(Section).filter(Section.name == "Yakuniy Test").first()
            if not yakuniy_test:
                db.add(Section(name="Yakuniy Test"))
                db.commit()
    finally:
        db.close()
