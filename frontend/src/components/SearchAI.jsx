import React, { useState } from 'react';
import { FaMicrophone, FaRobot, FaTimes } from 'react-icons/fa';

function SearchAI() {
  const [chatOpen, setChatOpen] = useState(false);
  const [message, setMessage] = useState("నమస్కారం! నేను మీకు ఏ విధంగా సహాయపడగలను?");

  const startVoice = () => {
    // బ్రౌజర్ లో వాయిస్ సపోర్ట్ ఉందో లేదో చెక్ చేస్తుంది
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("క్షమించండి, మీ బ్రౌజర్ వాయిస్ సెర్చ్‌ను సపోర్ట్ చేయడం లేదు.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'te-IN';
    recognition.start();
    
    recognition.onstart = () => alert("చెప్పండి, మీరు ఏ చీర కోసం వెతుకుతున్నారు...");
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      alert("AI అసిస్టెంట్: మీరు '" + transcript + "' అని వెతికారు. ఫలితాలు త్వరలో చూపిస్తాను.");
    };
  };

  return (
    <div style={{ background: "white", padding: "10px", borderRadius: "10px", display: "flex", gap: "10px", alignItems: "center", boxShadow: "0 2px 5px rgba(0,0,0,0.1)", marginBottom: "15px" }}>
      <input type="text" placeholder="చీరల కోసం వెతకండి..." style={{ flex: 1, border: "none", outline: "none", padding: "5px" }} />
      <button onClick={startVoice} style={{ border: "none", background: "none", cursor: "pointer" }}><FaMicrophone color="#4a1c1c" /></button>
      <button onClick={() => setChatOpen(!chatOpen)} style={{ border: "none", background: "none", cursor: "pointer" }}><FaRobot color="#4a1c1c" /></button>
      
      {chatOpen && (
        <div style={{ position: "fixed", bottom: "80px", right: "20px", background: "white", padding: "15px", borderRadius: "15px", border: "1px solid #ddd", width: "250px", boxShadow: "0 5px 15px rgba(0,0,0,0.2)", zIndex: 1000 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
            <strong>AV Silks AI</strong>
            <FaTimes onClick={() => setChatOpen(false)} style={{cursor: "pointer"}} />
          </div>
          <p style={{ fontSize: "13px" }}>{message}</p>
        </div>
      )}
    </div>
  );
}
export default SearchAI;
