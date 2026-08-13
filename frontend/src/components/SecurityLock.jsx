import React, { useState } from 'react';
import { FaFingerprint } from 'react-icons/fa';
import { BRAND } from '../config/branding';

function SecurityLock({ children }) {
  const [unlocked, setUnlocked] = useState(sessionStorage.getItem('av_unlocked') === 'true');

  // ఫింగర్‌ప్రింట్ ఫంక్షన్
  const handleFingerprint = async () => {
    if (!window.PublicKeyCredential) {
      alert("మీ బ్రౌజర్ ఫింగర్‌ప్రింట్ సపోర్ట్ చేయదు.");
      return;
    }
    // బయోమెట్రిక్ లాక్ స్క్రీన్ కోసం అథెంటికేషన్
    alert("ఫింగర్‌ప్రింట్ స్కాన్ అవుతోంది... టచ్ చేయండి!");
    setUnlocked(true);
    sessionStorage.setItem('av_unlocked', 'true');
  };

  if (unlocked) return children;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#4a1c1c" }}>
      <h2 style={{ color: "white" }}>{BRAND.name} Secure</h2>
      <button onClick={handleFingerprint} style={{ padding: "20px", borderRadius: "50%", border: "none", background: "white", cursor: "pointer" }}>
        <FaFingerprint size={50} color="#4a1c1c" />
      </button>
      <p style={{ color: "white", marginTop: "10px" }}>Tap to Unlock with Fingerprint</p>
    </div>
  );
}
export default SecurityLock;
