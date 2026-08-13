import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';
import { BRAND } from '../config/branding';

function PrivacyPolicy() {
  const navigate = useNavigate();

  return (
    <div style={{ background: "#fcf9f2", minHeight: "100vh" }}>
      <div style={{ background: "white", padding: "15px 20px", display: "flex", alignItems: "center", gap: "15px", position: "sticky", top: 0, boxShadow: "0 2px 5px rgba(0,0,0,0.05)" }}>
        <FaArrowLeft size={20} color="#4a1c1c" onClick={() => navigate(-1)} style={{ cursor: "pointer" }} />
        <h3 style={{ margin: 0, color: "#4a1c1c", fontSize: "18px" }}>Privacy & Policy</h3>
      </div>
      
      <div style={{ padding: "20px", color: "#444", lineHeight: "1.6", fontSize: "14px" }}>
        <h4 style={{ color: "#333" }}>1. Introduction</h4>
        <p>{BRAND.name} కు స్వాగతం. మీ వ్యక్తిగత గోప్యతను (Privacy) రక్షించడానికి మేము కట్టుబడి ఉన్నాము. యాప్ ద్వారా సేకరించిన మీ డేటా సురక్షితంగా ఉంటుంది.</p>
        
        <h4 style={{ color: "#333" }}>2. Data Collection & Usage</h4>
        <p>ఆర్డర్ డెలివరీ కోసం మీ పేరు, ఫోన్ నంబర్, మరియు అడ్రస్ మాత్రమే సేకరించబడుతుంది. మీ డేటాను మేము ఏ థర్డ్-పార్టీ సంస్థలకు విక్రయించము.</p>

        <h4 style={{ color: "#333" }}>3. Order Cancellation & Refunds</h4>
        <ul>
          <li>ఆర్డర్ 'Processing' లో ఉన్నప్పుడు మాత్రమే కస్టమర్ క్యాన్సిల్ చేసుకోగలరు.</li>
          <li>చీర డ్యామేజ్ అయిన సందర్భంలో మాత్రమే రిటర్న్/రీఫండ్ అంగీకరించబడుతుంది.</li>
        </ul>

        <h4 style={{ color: "#333" }}>4. App Security</h4>
        <p>మీ ఆర్డర్స్ మరియు ప్రొఫైల్ వివరాలు 4-డిజిట్ పిన్ (Security Lock) ద్వారా భద్రపరచబడ్డాయి.</p>
        
        <p style={{ marginTop: "30px", fontWeight: "bold", textAlign: "center", color: "#888" }}>{BRAND.copyright}</p>
      </div>
    </div>
  );
}
export default PrivacyPolicy;
