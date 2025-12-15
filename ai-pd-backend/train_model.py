# ...existing code...
import os
import pandas as pd
import joblib
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
from utils.featurizer import simple_features

# ===============================
# 1. Load or create a dataset
# ===============================
DATASET_PATH = "datasets/phishing_dataset.csv"  # Update with your dataset path

if not os.path.exists(DATASET_PATH):
    raise FileNotFoundError(f"❌ Dataset not found at {DATASET_PATH}")

data = pd.read_csv(DATASET_PATH)

# Expect columns: url, label
if 'url' not in data.columns or 'label' not in data.columns:
    raise ValueError("❌ Dataset must have 'url' and 'label' columns")

# ===============================
# 2. Extract features from URLs
# ===============================
feature_list = []
for url in data['url']:
    feat = simple_features(str(url))
    feature_list.append(feat)

X = np.vstack(feature_list)  # shape: (n_samples, n_features)
y = data['label'].astype(int).values

print(f"🔧 Extracted features shape: {X.shape}, labels shape: {y.shape}")

# ===============================
# 3. Train-test split
# ===============================
try:
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
except ValueError:
    # fallback when stratify isn't possible (e.g., single class)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

# ===============================
# 4. Train Random Forest Model
# ===============================
model = RandomForestClassifier(
    n_estimators=100,
    random_state=42,
    n_jobs=-1
)
model.fit(X_train, y_train)

# ===============================
# 5. Evaluate model
# ===============================
y_pred = model.predict(X_test)
acc = accuracy_score(y_test, y_pred)
print(f"✅ Model trained successfully! Accuracy: {acc:.4f}")

# ===============================
# 6. Save model
# ===============================
os.makedirs("models", exist_ok=True)
MODEL_PATH = "models/phishing_rf.pkl"
joblib.dump(model, MODEL_PATH)
print(f"💾 Model saved at: {MODEL_PATH}")
# ...existing code...