# ...existing code...
import os
import re
import joblib
import numpy as np
import pandas as pd
from html import unescape
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score

# ===============================
# CONFIG
# ===============================
DATA_PATH = "datasets/email_tree.csv"   # update if needed
MODEL_DIR = "models"
os.makedirs(MODEL_DIR, exist_ok=True)

# ===============================
# LOAD DATA
# ===============================
print("📂 Loading dataset...")
df = pd.read_csv(DATA_PATH)

# normalize columns: accept either (subject, from_address, body, label) OR (text, label)
found_cols = set(df.columns.tolist())
required_full = {"subject", "from_address", "body", "label"}

if required_full.issubset(found_cols):
    pass
elif {"text", "label"}.issubset(found_cols):
    df["body"] = df["text"].astype(str)
    df["subject"] = ""
    df["from_address"] = ""
else:
    raise ValueError(f"❌ Missing columns. Required either {required_full} or ('text','label'). Found: {sorted(found_cols)}")

df = df.fillna("")  # keep empty strings instead of dropping rows to preserve samples

# ===============================
# HELPERS (match utils/featurizer.py)
# ===============================
SUSPICIOUS_WORDS = ['login', 'verify', 'update', 'secure', 'bank', 'account', 'password', 'confirm', 'click', 'urgent']

def count_links(text: str) -> int:
    return len(re.findall(r"https?://[^\s'\"<>]+", text))

def count_special_chars(text: str) -> int:
    return len(re.findall(r'[^a-zA-Z0-9\s]', text))

def count_html_tags(text: str) -> int:
    return len(re.findall(r"<[^>]+>", text))

def has_mismatch_sender_display(sender: str) -> int:
    if not sender:
        return 0
    s = sender.lower()
    return 1 if re.search(r'paypal|apple|bankof|microsoft|amazon', s) and ('-' in s or 'secure' in s or 'verify' in s) else 0

def count_suspicious_words(text: str) -> int:
    t = text.lower()
    return sum(1 for w in SUSPICIOUS_WORDS if w in t)

def digits_count(text: str) -> int:
    return len(re.findall(r'\d', text))

# ===============================
# PREPROCESS & FEATURES
# ===============================
print("🔧 Extracting features...")

def combined_text(row):
    return f"{unescape(str(row.get('subject','')))} {unescape(str(row.get('from_address','')))} {unescape(str(row.get('body','')))}".strip()

df["combined_text"] = df.apply(combined_text, axis=1)

# TF-IDF Vectorizer
vectorizer = TfidfVectorizer(max_features=1000, stop_words="english")
X_tfidf = vectorizer.fit_transform(df["combined_text"])

# Handcrafted features (12 features to match featurizer.py)
subject_len = df["subject"].apply(lambda s: len(str(s)))
body_len = df["body"].apply(lambda s: len(str(s)))
subject_excl = df["subject"].apply(lambda s: str(s).count('!'))
body_excl = df["body"].apply(lambda s: str(s).count('!'))
subject_q = df["subject"].apply(lambda s: str(s).count('?'))
body_q = df["body"].apply(lambda s: str(s).count('?'))
url_count = df["combined_text"].apply(count_links)
suspicious = df["combined_text"].apply(count_suspicious_words)
html_tags = df["body"].apply(count_html_tags)
sender_mismatch = df["from_address"].apply(has_mismatch_sender_display)
digits = df["combined_text"].apply(digits_count)
special_chars = df["combined_text"].apply(count_special_chars)

handcrafted = np.vstack([
    subject_len,
    body_len,
    subject_excl,
    body_excl,
    subject_q,
    body_q,
    url_count,
    suspicious,
    html_tags,
    sender_mismatch,
    digits,
    special_chars
]).T.astype(float)

# Combine TF-IDF + handcrafted
X = np.hstack([X_tfidf.toarray(), handcrafted])

# ===============================
# LABEL PROCESSING (robust)
# ===============================
labels_raw = df["label"].astype(str).str.strip()

# Try direct numeric conversion first
try:
    y = labels_raw.astype(int).values
except Exception:
    # Attempt keyword-based mapping
    pos_keywords = {'phish', 'phishing', 'spam', 'malicious', 'scam'}
    neg_keywords = {'safe', 'legitimate', 'ham', 'benign', 'clean', 'not phishing', 'safe email', 'safe_email'}
    unique_labels = list(dict.fromkeys(labels_raw.tolist()))
    mapping = {}
    for lab in unique_labels:
        l = lab.lower()
        if any(k in l for k in pos_keywords):
            mapping[lab] = 1
        elif any(k in l for k in neg_keywords):
            mapping[lab] = 0

    if len(mapping) == len(unique_labels):
        y = np.array([mapping[v] for v in labels_raw], dtype=int)
        print(f"ℹ️ Auto-mapped labels -> {mapping}")
    else:
        raise ValueError(f"❌ Could not auto-map labels to integers. Found labels: {unique_labels}. Provide explicit numeric labels or update mapping in the script.")

print(f"✅ Feature matrix shape: {X.shape}, labels shape: {y.shape}")

# ===============================
# TRAIN / EVAL
# ===============================
try:
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.20, random_state=42, stratify=y)
except ValueError:
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.20, random_state=42)

model = RandomForestClassifier(n_estimators=200, random_state=42, n_jobs=-1)
model.fit(X_train, y_train)

y_pred = model.predict(X_test)
print("🎯 Accuracy:", accuracy_score(y_test, y_pred))
print(classification_report(y_test, y_pred))

# ===============================
# SAVE
# ===============================
joblib.dump(model, os.path.join(MODEL_DIR, "email_rf.pkl"))
joblib.dump(vectorizer, os.path.join(MODEL_DIR, "email_vectorizer.pkl"))
print(f"💾 Saved model -> {os.path.join(MODEL_DIR, 'email_rf.pkl')}")
print(f"💾 Saved vectorizer -> {os.path.join(MODEL_DIR, 'email_vectorizer.pkl')}")
print("✅ Training complete.")
# ...existing code...