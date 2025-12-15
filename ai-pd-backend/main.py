# ...existing code...
import os
from datetime import datetime
from pathlib import Path
from typing import Dict

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel
from pymongo import MongoClient
import joblib
import numpy as np
import traceback

# ===============================
# CONFIGURATION
# ===============================
BASE_DIR = Path(__file__).resolve().parent
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "xaipd_db")

URL_MODEL_PATH = BASE_DIR / "models/phishing_rf.pkl"
EMAIL_MODEL_PATH = BASE_DIR / "models/email_rf.pkl"
EMAIL_VECTORIZER_PATH = BASE_DIR / "models/email_vectorizer.pkl"

# ===============================
# INITIALIZE SERVICES
# ===============================
client = MongoClient(MONGO_URI)
db = client[DB_NAME]

# ===============================
# LOAD MODELS
# ===============================
def load_model(path: Path, name: str):
    if not path.exists():
        print(f"⚠️  {name} not found at {path}")
        return None
    try:
        model = joblib.load(path)
        print(f"✅ {name} loaded from {path}")
        return model
    except Exception as e:
        print(f"⚠️  Failed to load {name} from {path}: {e}")
        return None

url_model = load_model(URL_MODEL_PATH, "URL model")
email_model = load_model(EMAIL_MODEL_PATH, "Email model")
email_vectorizer = load_model(EMAIL_VECTORIZER_PATH, "Email vectorizer")

# ===============================
# FASTAPI APP
# ===============================
app = FastAPI(
    title="XAI-PD Backend",
    description="Explainable AI for Phishing Detection (URL + Email)",
    version="1.5.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ===============================
# UTILS
# ===============================
from utils.featurizer import simple_features, email_features
from utils.explainer import explain_prediction
from utils.auth import (
    hash_password,
    verify_password,
    create_access_token,
    decode_access_token,
)

# ===============================
# SCHEMAS
# ===============================
class URLInput(BaseModel):
    url: str

class EmailInput(BaseModel):
    subject: str
    text: str
    from_address: str

class UserRegister(BaseModel):
    username: str
    password: str

# ===============================
# ROOT
# ===============================
@app.get("/")
def root() -> Dict[str, str]:
    return {"message": "✅ XAI-PD Backend is running"}

# ===============================
# AUTH
# ===============================
@app.post("/register")
def register_user(user: UserRegister):
    if db.users.find_one({"username": user.username}):
        raise HTTPException(status_code=400, detail="Username already exists")
    hashed_pwd = hash_password(user.password)
    db.users.insert_one({
        "username": user.username,
        "password": hashed_pwd,
        "created_at": datetime.utcnow()
    })
    return {"message": "User registered successfully ✅", "username": user.username}

@app.post("/login")
def login_user(form_data: OAuth2PasswordRequestForm = Depends()):
    user = db.users.find_one({"username": form_data.username})
    if not user or not verify_password(form_data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid username or password")
    token = create_access_token({"sub": user["username"]})
    return {"access_token": token, "token_type": "bearer"}

# ===============================
# HELPERS
# ===============================
def ensure_2d(arr):
    arr = np.asarray(arr)
    if arr.ndim == 1:
        return arr.reshape(1, -1)
    return arr

def safe_round_proba(p):
    return round(p, 4) if p is not None else None

# ===============================
# URL PREDICTION
# ===============================
@app.post("/predict/url")
def predict_url(data: URLInput, current_user: str = Depends(decode_access_token)):
    try:
        if url_model is None:
            raise HTTPException(status_code=500, detail="URL model not loaded")

        features = simple_features(data.url)
        features = ensure_2d(features)

        # optional sanity check
        expected = getattr(url_model, "n_features_in_", None)
        if expected is not None and features.shape[1] != expected:
            raise HTTPException(
                status_code=500,
                detail=f"URL feature mismatch: got {features.shape[1]}, expected {expected}."
            )

        prediction = int(url_model.predict(features)[0])
        status = "phishing" if prediction == 1 else "legitimate"
        proba = None
        if hasattr(url_model, "predict_proba"):
            proba = float(url_model.predict_proba(features)[0][1])
        explanation = explain_prediction(features, model_type="url")

        db.predictions.insert_one({
            "username": current_user,
            "type": "url",
            "input": data.url,
            "prediction": status,
            "probability": proba,
            "explanation": explanation,
            "timestamp": datetime.utcnow(),
        })

        return {
            "user": current_user,
            "url": data.url,
            "status": status,
            "probability": safe_round_proba(proba),
            "explanation": explanation,
        }

    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"URL Prediction error: {str(e)}")

# ===============================
# EMAIL PREDICTION
# ===============================
@app.post("/predict/email")
def predict_email(data: EmailInput, current_user: str = Depends(decode_access_token)):
    try:
        if email_model is None:
            raise HTTPException(status_code=500, detail="Email model not loaded")

        combined_text = data.text or ""

        # If we have a vectorizer, prefer it (common when model trained on TF-IDF / CountVectorizer)
        if email_vectorizer is not None:
            X = email_vectorizer.transform([combined_text])
            # convert sparse -> dense if needed
            if hasattr(X, "toarray"):
                X = X.toarray()
            X_final = ensure_2d(X)
        else:
            X_final = email_features(
                subject="",          # keep empty if model not using subject/from
                body=combined_text,
                from_address=""
            )
            X_final = ensure_2d(X_final)

        # Safety check against model expectation
        expected_features = getattr(email_model, "n_features_in_", None)
        if expected_features is not None:
            actual_features = X_final.shape[1]
            if actual_features != expected_features:
                raise HTTPException(
                    status_code=500,
                    detail=f"Email feature mismatch: got {actual_features}, expected {expected_features}. "
                           f"Check features/vectorizer used during training."
                )

        prediction = int(email_model.predict(X_final)[0])
        status = "phishing" if prediction == 1 else "legitimate"
        proba = None
        if hasattr(email_model, "predict_proba"):
            proba = float(email_model.predict_proba(X_final)[0][1])
        explanation = explain_prediction(X_final, model_type="email")

        db.predictions.insert_one({
            "username": current_user,
            "type": "email",
            "input": combined_text,
            "prediction": status,
            "probability": proba,
            "explanation": explanation,
            "timestamp": datetime.utcnow(),
        })

        return {
            "user": current_user,
            "email": {
                "subject": data.subject,
                "from_address": data.from_address,
                "text": data.text
            },
            "status": status,
            "probability": safe_round_proba(proba),
            "explanation": explanation,
        }

    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Email Prediction error: {str(e)}")

# ===============================
# HISTORY
# ===============================
@app.get("/predictions")
def get_user_predictions(current_user: str = Depends(decode_access_token)):
    try:
        results = []
        cursor = db.predictions.find({"username": current_user}).sort("timestamp", -1)
        for doc in cursor:
            doc["_id"] = str(doc["_id"])
            results.append(doc)
        return {"user": current_user, "count": len(results), "data": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ===============================
# ADMIN USERS
# ===============================
@app.get("/users")
def list_users():
    users = list(db.users.find({}, {"_id": 0, "password": 0}))
    return {"total_users": len(users), "users": users}
# ...existing code...