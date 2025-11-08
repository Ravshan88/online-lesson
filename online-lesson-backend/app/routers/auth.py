import jwt
from fastapi import Depends, HTTPException, status, APIRouter
from sqlalchemy.orm import Session
from fastapi.security.oauth2 import OAuth2PasswordRequestForm

from .. import schemas, models, utils, oauth2, database

router = APIRouter(tags=["auth"], prefix="/auth")


@router.post("/login", response_model=schemas.Token)
def login(user_credentials: schemas.UserLogin, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.username == user_credentials.username).first()
    if not user_credentials.password == user.password:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password")

    # if not utils.verify_password(user_credentials.password, user.password):
    #     raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password")
    access_token = oauth2.create_access_token({"user_id": user.id, "email": user.username})
    return {"access_token": access_token, "token_type": "bearer"}
