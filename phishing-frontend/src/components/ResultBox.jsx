export default function ResultBox({ result }) {
  if (!result) return null;

  // Try to find a confidence/score value in common response shapes
  const possibleKeys = [
    "confidence",
    "score",
    "probability",
    "prob",
    "confidence_score",
    "prediction_confidence",
  ];

  let rawScore = null;
  for (const k of possibleKeys) {
    if (result[k] !== undefined && result[k] !== null) {
      rawScore = result[k];
      break;
    }
  }

  // Some backends may return probabilities as arrays or objects
  if (rawScore == null) {
    if (Array.isArray(result.probabilities) && result.probabilities.length) {
      // assume probabilities aligned with classes; pick max as confidence
      rawScore = Math.max(...result.probabilities);
    } else if (result.probabilities && typeof result.probabilities === 'object') {
      // object like { phishing: 0.8, benign: 0.2 }
      const vals = Object.values(result.probabilities);
      if (vals.length) rawScore = Math.max(...vals);
    }
  }

  // If still null, try nested fields
  if (rawScore == null && result.metadata && result.metadata.confidence) {
    rawScore = result.metadata.confidence;
  }

  // Format the score to a percentage if it's a number
  let displayConfidence = "N/A";
  if (rawScore != null && !Number.isNaN(Number(rawScore))) {
    let n = Number(rawScore);
    // If in [0,1], convert to percent
    if (n <= 1) n = n * 100;
    displayConfidence = `${n.toFixed(1)}%`;
  }

  return (
    <div className="result-box">
      <h3>Analysis Result</h3>
      <p><strong>Status:</strong> {result.status}</p>
      <p><strong>Confidence:</strong> {displayConfidence}</p>
    </div>
  );
}
