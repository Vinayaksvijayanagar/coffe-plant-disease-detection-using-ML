import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./App.css";

function App() {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [prediction, setPrediction] = useState("");
  const [translationData, setTranslationData] = useState({});
  const [language, setLanguage] = useState("en");
  const [listening, setListening] = useState(false);
  const [text, setText] = useState("");
  const [voiceHistory, setVoiceHistory] = useState([]);
  const [theme, setTheme] = useState("light");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const recognitionRef = useRef(null);

  // Set preview image
  useEffect(() => {
    if (!image) {
      setPreview(null);
      return;
    }
    const objectUrl = URL.createObjectURL(image);
    setPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [image]);

  // Initialize speech recognition
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = "en-US";

      recognitionRef.current.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map((result) => result[0])
          .map((result) => result.transcript)
          .join("");
        setText(transcript);
        setVoiceHistory((prev) => [...prev, transcript]);
        console.log("Transcript:", transcript);
      };

      recognitionRef.current.onerror = (e) => {
        console.error("Speech recognition error:", e);
        setListening(false);
      };

      recognitionRef.current.onend = () => {
        setListening(false);
      };
    } else {
      alert("Speech Recognition not supported in this browser.");
    }
  }, []);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
    }
  };

  const handleLanguageChange = (e) => {
    setLanguage(e.target.value);
  };

  const handleSubmit = async () => {
    if (!image) {
      alert("Please upload an image first.");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("file", image);

    try {
      const response = await axios.post("http://127.0.0.1:5000/predict", formData);
      setPrediction(response.data.class);
      setTranslationData(response.data.translations);

      navigate("/result", {
        state: {
          prediction: response.data.class,
          translationData: response.data.translations,
          language: language,
          imagePreview: preview,
          text: text,
          theme: theme,
          voiceHistory: [...voiceHistory, text],
        },
      });
    } catch (error) {
      console.error("Prediction error:", error);
      alert("Prediction failed.");
    } finally {
      setLoading(false);
    }
  };

  const startListening = () => {
    if (recognitionRef.current && !listening) {
      recognitionRef.current.start();
      setListening(true);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && listening) {
      recognitionRef.current.stop();
      setListening(false);
    }
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  return (
    <div className={`app-container ${theme}`}>
      <h1>Coffee Plant Disease Detection</h1>
      <p className="description">
        This project uses artificial intelligence to detect diseases in coffee plants from leaf images. 
        It supports multiple languages, includes voice-based search, and integrates Google Search for fast information access.
        Ideal for farmers, agronomists, and researchers, it enables smart farming and quick disease management.
      </p>

      <div className="top-bar">
        <label>Select Language: </label>
        <select value={language} onChange={handleLanguageChange}>
          <option value="en">English</option>
          <option value="es">Spanish</option>
          <option value="hi">Hindi</option>
          <option value="kn">Kannada</option>
          <option value="te">Telugu</option>
        </select>

        <button className="toggle-theme" onClick={toggleTheme}>
          {theme === "light" ? "🌙 Dark Mode" : "☀️ Light Mode"}
        </button>
      </div>

      <div className="voice-search">
        <label>Voice Search:</label>
        <button onClick={startListening} disabled={listening}>🎤 Start</button>
        <button onClick={stopListening}>🛑 Stop</button>
        <div className="voice-text"><li><strong>Text:</strong> {text || "Not recorded yet"}</li></div>
        {text && (
          <a href={`https://www.google.com/search?q=${text}`} target="_blank" rel="noopener noreferrer">
            <button>🔍 Google Search</button>
          </a>
        )}
      </div>

      <div className="upload-section">
        <input type="file" accept="image/*" onChange={handleImageUpload} />
        <button onClick={handleSubmit}>Predict</button>
      </div>

      {preview && (
        <div className="image-preview">
          <img src={preview} alt="Preview" />
        </div>
      )}

      {loading && <p className="loading">Loading prediction results...</p>}

      <footer className="footer">
        Built with ❤️ using React & Flask
      </footer>
    </div>
  );
}

export default App;
