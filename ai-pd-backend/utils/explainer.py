# ...existing code...
import os
import joblib
import numpy as np
from typing import List, Dict
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier

# shap is optional — use if available
try:
    import shap  # type: ignore
    _HAS_SHAP = True
except Exception:
    _HAS_SHAP = False

# ===============================
# MODEL PATHS / NAMES
# ===============================
URL_MODEL_PATH = os.getenv("URL_MODEL_PATH", "models/phishing_rf.pkl")
EMAIL_MODEL_PATH = os.getenv("EMAIL_MODEL_PATH", "models/email_rf.pkl")

URL_FEATURE_NAMES = [
    'url_length', 'dot_count', 'has_https', 'special_chars', 'has_at_symbol',
    'is_ip', 'domain_length', 'digits_count', 'has_hyphen', 'path_length'
]

# ===============================
# LOAD MODELS (non-fatal)
# ===============================
def _safe_load(path: str):
    if os.path.exists(path):
        try:
            return joblib.load(path)
        except Exception as e:
            print(f"⚠️ Failed to load model at {path}: {e}")
    else:
        print(f"⚠️ Model not found at {path}")
    return None

url_model = _safe_load(URL_MODEL_PATH)
email_model = _safe_load(EMAIL_MODEL_PATH)

# ===============================
# CREATE EXPLAINERS (if shap available)
# ===============================
url_explainer = None
email_explainer = None

if _HAS_SHAP:
    try:
        if url_model is not None:
            n_feats = getattr(url_model, "n_features_in_", len(URL_FEATURE_NAMES))
            if isinstance(url_model, RandomForestClassifier):
                url_explainer = shap.TreeExplainer(url_model)
            else:
                # provide a simple zero-background with the expected number of features
                url_explainer = shap.KernelExplainer(lambda x: url_model.predict_proba(x), np.zeros((1, n_feats)))
    except Exception as e:
        print(f"⚠️ Could not create URL explainer: {e}")
        url_explainer = None

    try:
        if email_model is not None:
            n_feats_e = getattr(email_model, "n_features_in_", 1)
            if isinstance(email_model, LogisticRegression):
                email_explainer = shap.LinearExplainer(email_model, np.zeros((1, n_feats_e)))
            else:
                email_explainer = shap.TreeExplainer(email_model)
    except Exception as e:
        print(f"⚠️ Could not create Email explainer: {e}")
        email_explainer = None

# ===============================
# HELPERS
# ===============================
def _to_numpy(arr) -> np.ndarray:
    """Convert input to 2D numpy array."""
    if hasattr(arr, "toarray"):
        arr = arr.toarray()
    arr = np.asarray(arr)
    if arr.ndim == 1:
        arr = arr.reshape(1, -1)
    return arr

def _top_k_explanation(names: List[str], impacts: np.ndarray, top_k: int = 20) -> List[Dict]:
    items = [{"feature": names[i] if i < len(names) else f"Feature_{i}", "impact": float(val)}
             for i, val in enumerate(np.asarray(impacts).ravel())]
    items = sorted(items, key=lambda x: abs(x["impact"]), reverse=True)
    return items[:top_k]

# ===============================
# EMAIL EXPLAINER
# ===============================
def explain_email_prediction(features) -> List[Dict]:
    """
    Explain an email prediction.
    - `features` should be a 2D array/vector (sparse or dense).
    - Returns list of {feature, impact} sorted by absolute impact desc.
    """
    if email_model is None:
        raise RuntimeError("Email model not loaded")

    X = _to_numpy(features)

    # Prefer SHAP if available and explainer built
    if _HAS_SHAP and email_explainer is not None:
        try:
            shap_vals = email_explainer.shap_values(X)
            # normalize shap output to 1D impacts array
            if isinstance(shap_vals, list):
                chosen = shap_vals[1] if len(shap_vals) > 1 else shap_vals[0]
                vals = np.asarray(chosen)
                if vals.ndim > 1:
                    vals = vals[0]
            else:
                vals = np.asarray(shap_vals)
                if vals.ndim > 1:
                    vals = vals[0]
            vals = np.asarray(vals).ravel()
            return _top_k_explanation([f"Feature_{i}" for i in range(vals.shape[0])], vals)
        except Exception as e:
            print(f"⚠️ SHAP email explanation failed: {e}")

    # Fallbacks: coefficients (linear) or feature_importances_ (tree)
    if hasattr(email_model, "coef_"):
        coeffs = np.asarray(email_model.coef_).ravel()
        return _top_k_explanation([f"Feature_{i}" for i in range(coeffs.shape[0])], coeffs)
    if hasattr(email_model, "feature_importances_"):
        imps = np.asarray(email_model.feature_importances_)
        return _top_k_explanation([f"Feature_{i}" for i in range(imps.shape[0])], imps)

    # Last resort: use model prediction sensitivity by perturbing each feature
    try:
        base_pred = email_model.predict_proba(X)[0, 1] if hasattr(email_model, "predict_proba") else email_model.predict(X)[0]
        impacts = []
        eps = 1e-4
        for i in range(X.shape[1]):
            Xp = X.copy()
            Xp[0, i] += eps
            p = email_model.predict_proba(Xp)[0, 1] if hasattr(email_model, "predict_proba") else email_model.predict(Xp)[0]
            impacts.append((p - base_pred) / eps)
        impacts = np.asarray(impacts)
        return _top_k_explanation([f"Feature_{i}" for i in range(impacts.shape[0])], impacts)
    except Exception as e:
        print(f"⚠️ Email fallback explanation failed: {e}")
        return []

# ===============================
# URL EXPLAINER
# ===============================
def explain_url_prediction(features) -> List[Dict]:
    """
    Explain a URL prediction using the URL feature names defined above.
    - `features` should be a 1xN or NxM array (converted to 2D numpy).
    """
    if url_model is None:
        raise RuntimeError("URL model not loaded")

    X = _to_numpy(features)

    # If feature-count mismatch between the model and runtime features, skip SHAP to avoid errors
    model_expected = getattr(url_model, "n_features_in_", None)
    if model_expected is not None and X.shape[1] != model_expected:
        print(f"⚠️ URL explainer: feature count mismatch runtime={X.shape[1]} model={model_expected}; skipping SHAP.")
    else:
        if _HAS_SHAP and url_explainer is not None:
            try:
                shap_vals = url_explainer.shap_values(X)
                # Normalize SHAP output to a 1D array of impacts
                if isinstance(shap_vals, list):
                    chosen = shap_vals[1] if len(shap_vals) > 1 else shap_vals[0]
                    vals = np.asarray(chosen)
                    if vals.ndim > 1:
                        vals = vals[0]
                else:
                    vals = np.asarray(shap_vals)
                    if vals.ndim > 1:
                        vals = vals[0]
                vals = np.asarray(vals).ravel()
                return _top_k_explanation(URL_FEATURE_NAMES, vals, top_k=len(URL_FEATURE_NAMES))
            except Exception as e:
                print(f"⚠️ SHAP URL explanation failed: {e}")

    # Fallbacks
    if hasattr(url_model, "feature_importances_"):
        imps = np.asarray(url_model.feature_importances_)
        return _top_k_explanation(URL_FEATURE_NAMES, imps, top_k=len(URL_FEATURE_NAMES))
    if hasattr(url_model, "coef_"):
        coeffs = np.asarray(url_model.coef_).ravel()
        return _top_k_explanation(URL_FEATURE_NAMES, coeffs, top_k=len(URL_FEATURE_NAMES))

    # Sensitivity fallback
    try:
        base_pred = url_model.predict_proba(X)[0, 1] if hasattr(url_model, "predict_proba") else url_model.predict(X)[0]
        impacts = []
        eps = 1e-6
        for i in range(X.shape[1]):
            Xp = X.copy()
            Xp[0, i] += eps
            p = url_model.predict_proba(Xp)[0, 1] if hasattr(url_model, "predict_proba") else url_model.predict(Xp)[0]
            impacts.append((p - base_pred) / eps)
        impacts = np.asarray(impacts)
        return _top_k_explanation(URL_FEATURE_NAMES, impacts, top_k=len(URL_FEATURE_NAMES))
    except Exception as e:
        print(f"⚠️ URL fallback explanation failed: {e}")
        return []

# ===============================
# UNIFIED FUNCTION
# ===============================
def explain_prediction(features, model_type: str = "email") -> List[Dict]:
    if model_type == "email":
        return explain_email_prediction(features)
    elif model_type == "url":
        return explain_url_prediction(features)
    else:
        raise ValueError("model_type must be 'email' or 'url'")
# ...existing code...