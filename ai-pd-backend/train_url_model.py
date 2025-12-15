# Updated to extract the same numeric URL features used by utils.featurizer.simple_features
import os
import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report
from utils.featurizer import simple_features

DATASET_PATH = "datasets/phishing_dataset.csv"  # must have 'url' and 'label' columns
MODEL_DIR = "models"
os.makedirs(MODEL_DIR, exist_ok=True)
MODEL_PATH = os.path.join(MODEL_DIR, "phishing_rf.pkl")

if not os.path.exists(DATASET_PATH):
    raise FileNotFoundError(f"❌ Dataset not found at {DATASET_PATH}")

df = pd.read_csv(DATASET_PATH)
if 'url' not in df.columns or 'label' not in df.columns:
    raise ValueError("❌ Dataset must have 'url' and 'label' columns")

# Extract numeric features with the project's featurizer to keep parity with runtime
feature_list = []
for u in df['url'].astype(str):
    feature_list.append(simple_features(u))
X = np.vstack(feature_list)
y = df['label'].astype(int).values

print(f"🔧 Extracted features shape: {X.shape}, labels shape: {y.shape}")

try:
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
except ValueError:
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

model = RandomForestClassifier(n_estimators=200, random_state=42, n_jobs=-1)
model.fit(X_train, y_train)

y_pred = model.predict(X_test)
acc = accuracy_score(y_test, y_pred)
print(f"🎯 Accuracy: {acc:.4f}")
print(classification_report(y_test, y_pred))

joblib.dump(model, MODEL_PATH)
print(f"💾 URL model saved at: {MODEL_PATH}")
