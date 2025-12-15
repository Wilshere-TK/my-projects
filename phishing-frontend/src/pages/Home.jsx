import { useState } from "react";
import api from "../api/axiosInstance";
import UrlInput from "../components/UrlInput";
import ResultBox from "../components/ResultBox";

export default function Home({ onLogout }) {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const analyzeInput = async (value, type = "url") => {
    try {
      setLoading(true);
      setResult(null);

      // Send both fields; backend can use `type` to decide how to handle
      let res;
      if (type === "url") {
        res = await api.post("/api/predict/url", { url: value });
      } else {
        // email
        res = await api.post("/api/predict/email", { subject: "", text: value, from_address: "" });
      }

      setResult(res.data);
      setLoading(false);
    } catch (err) {
      setLoading(false);
      alert("Error connecting to backend");
    }
  };

  return (
    <div>
      <div className="mb-3">
        <h1>AI Phishing Detection Tool</h1>
      </div>

      <UrlInput onSubmit={analyzeInput} />

      {loading ? <p>Checking...</p> : <ResultBox result={result} />}
    </div>
  );
}
