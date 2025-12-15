# ...existing code...
import numpy as np
import re
from urllib.parse import urlparse
from html import unescape
import joblib
import os
from typing import Optional

# ===============================
# URL FEATURES
# ===============================
def simple_features(url: str):
    """
    Extract basic URL features.
    Returns: 1D numpy array of length n_features
    """
    parsed = urlparse(url)
    domain = parsed.netloc
    path = parsed.path

    url_length = len(url)
    dot_count = domain.count(".")
    has_https = 1 if url.startswith("https") else 0
    special_chars = len(re.findall(r'[^a-zA-Z0-9]', url))
    has_at_symbol = 1 if "@" in url else 0

    domain_only = domain.split(':')[0]
    is_ip = 1 if re.match(r"^\d{1,3}(\.\d{1,3}){3}$", domain_only) else 0
    domain_length = len(domain_only)
    digits_count = len(re.findall(r'\d', url))
    has_hyphen = 1 if "-" in domain_only else 0
    path_length = len(path)

    features = np.array([
        url_length,
        dot_count,
        has_https,
        special_chars,
        has_at_symbol,
        is_ip,
        domain_length,
        digits_count,
        has_hyphen,
        path_length
    ], dtype=float)

    return features

# ===============================
# EMAIL / TEXT FEATURES
# ===============================
VECTORIZER_PATH = os.getenv("EMAIL_VECTORIZER_PATH", "models/email_vectorizer.pkl")
_email_vectorizer: Optional[object] = None

if os.path.exists(VECTORIZER_PATH):
    try:
        _email_vectorizer = joblib.load(VECTORIZER_PATH)
        print(f"✅ Email vectorizer loaded from {VECTORIZER_PATH}")
    except Exception as e:
        print(f"⚠️ Failed loading email vectorizer from {VECTORIZER_PATH}: {e}")
else:
    print(f"⚠️ Email vectorizer not found at {VECTORIZER_PATH}. Predictions that rely on TF-IDF will fail.")

def set_email_vectorizer(vec):
    """Allow injection of a pre-loaded vectorizer (used by main.py if it loads models)."""
    global _email_vectorizer
    _email_vectorizer = vec

def _count_urls_in_text(text: str):
    return len(re.findall(r"https?://[^\s'\"<>]+", text))

def _count_suspicious_words(text: str, suspicious_words=None):
    if suspicious_words is None:
        suspicious_words = ['login', 'verify', 'update', 'secure', 'bank', 'account', 'password', 'confirm', 'click', 'urgent']
    text_lower = text.lower()
    return sum(1 for w in suspicious_words if w in text_lower)

def _count_html_tags(text: str):
    return len(re.findall(r"<[^>]+>", text))

def _has_mismatch_sender_display(sender: str):
    if not sender:
        return 0
    sender = sender.lower()
    return 1 if re.search(r'paypal|apple|bankof|microsoft|amazon', sender) and ('-' in sender or 'secure' in sender or 'verify' in sender) else 0

def email_features(subject: str = "", body: str = "", from_address: str = "", vectorizer: Optional[object] = None, allow_handcrafted_only: bool = False):
    """
    Extract combined feature vector from email:
    - If `vectorizer` is provided it will be used; otherwise the module-level vectorizer is used.
    - If no vectorizer is available and allow_handcrafted_only is False, a RuntimeError is raised.
    - Returns a 1D numpy array (features).
    """
    vec = vectorizer if vectorizer is not None else _email_vectorizer

    subj = unescape(subject or "")
    b = unescape(body or "")
    text_combined = f"{subj} {b}".strip()

    # Handcrafted features (always computed)
    subject_len = len(subj)
    body_len = len(b)
    subject_exclamations = subj.count('!')
    body_exclamations = b.count('!')
    subject_question = subj.count('?')
    body_question = b.count('?')
    url_count = _count_urls_in_text(subj) + _count_urls_in_text(b)
    suspicious_words = _count_suspicious_words(text_combined)
    html_tags = _count_html_tags(b)
    sender_mismatch = _has_mismatch_sender_display(from_address)
    digits_count = len(re.findall(r'\d', text_combined))
    special_chars = len(re.findall(r'[^a-zA-Z0-9\s]', text_combined))

    handcrafted = np.array([
        subject_len,
        body_len,
        subject_exclamations,
        body_exclamations,
        subject_question,
        body_question,
        url_count,
        suspicious_words,
        html_tags,
        sender_mismatch,
        digits_count,
        special_chars
    ], dtype=float)

    # If no vectorizer available, either return handcrafted only or error depending on flag
    if vec is None:
        if allow_handcrafted_only:
            return handcrafted
        raise RuntimeError("❌ Email vectorizer not loaded. Pass a vectorizer or set allow_handcrafted_only=True to get handcrafted features only.")

    # TF-IDF features
    try:
        tfidf_features = vec.transform([text_combined])
        if hasattr(tfidf_features, "toarray"):
            tfidf_features = tfidf_features.toarray()
        else:
            tfidf_features = np.asarray(tfidf_features)
        tfidf_row = tfidf_features.ravel()
    except Exception as e:
        raise RuntimeError(f"Failed to compute TF-IDF features: {e}")

    # Combine TF-IDF + handcrafted into single 1D vector
    combined = np.hstack([tfidf_row, handcrafted]).astype(float)
    return combined
# ...existing code...