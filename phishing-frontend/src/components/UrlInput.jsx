import { useState } from "react";

export default function UrlInput({ onSubmit }) {
  const [value, setValue] = useState("");
  const [type, setType] = useState("auto"); // 'auto' | 'url' | 'email'

  const validateEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  const validateUrl = (v) => {
    try {
      // try to construct a URL; if it fails, try adding http://
      new URL(v);
      return true;
    } catch (_) {
      try {
        new URL("http://" + v);
        return true;
      } catch (_) {
        return false;
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const v = value.trim();
    if (v === "") return;

    let finalType = type;
    if (type === "auto") {
      if (validateEmail(v)) finalType = "email";
      else if (validateUrl(v)) finalType = "url";
      else {
        alert("Please enter a valid URL or email address.");
        return;
      }
    } else if (type === "email" && !validateEmail(v)) {
      alert("Please enter a valid email address.");
      return;
    } else if (type === "url" && !validateUrl(v)) {
      alert("Please enter a valid URL.");
      return;
    }

    onSubmit(v, finalType);
  };

  return (
    <form onSubmit={handleSubmit} className="input-box">
      <div className="mb-2 d-flex gap-2 align-items-center">
        <select className="form-select w-auto" value={type} onChange={(e) => setType(e.target.value)}>
          <option value="auto">Auto-detect</option>
          <option value="url">URL</option>
          <option value="email">Email</option>
        </select>
        <input
          type="text"
          className="form-control"
          placeholder={type === "url" ? "Enter URL to check..." : "Enter email address to check..."}
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
      </div>
      <button type="submit" className="btn btn-primary">Check</button>
    </form>
  );
}
