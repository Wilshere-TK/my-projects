# ...existing code...
import os
import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from utils.featurizer import simple_features

# ===============================
# Load dataset
# ===============================
DATA_PATH = "phishing_dataset.csv"  # make sure your CSV has 'url' and 'label' columns
if not os.path.exists(DATA_PATH):
    raise FileNotFoundError(f"❌ Dataset not found at {DATA_PATH}")

df = pd.read_csv(DATA_PATH)

# Ensure columns exist
if "url" not in df.columns or "label" not in df.columns:
    raise ValueError("❌ Dataset must have 'url' and 'label' columns")

urls = df["url"].tolist()
y = df["label"].tolist()  # 1 = phishing, 0 = safe

# ===============================
# Extract features
# ===============================
X = np.vstack([simple_features(url) for url in urls])

# ===============================
# Train Random Forest model
# ===============================
model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X, y)

# ===============================
# Save model (match main.py URL_MODEL_PATH)
# ===============================
os.makedirs("models", exist_ok=True)
MODEL_PATH = "models/phishing_rf.pkl"   # <-- matched to main.py
joblib.dump(model, MODEL_PATH)
print(f"✅ Model trained and saved at {MODEL_PATH}")
# ...existing code...