import { useState } from 'react';

const dictionaries = {
  en: { title: "Feedback", rating: "Rate your experience", comment: "Any comments?", submit: "Submit" },
  hi: { title: "प्रतिक्रिया", rating: "अपना अनुभव रेट करें", comment: "कोई टिप्पणी?", submit: "जमा करें" },
  mr: { title: "प्रतिक्रिया", rating: "तुमचा अनुभव रेट करा", comment: "काही टिप्पण्या?", submit: "प्रस्तुत करा" }
};

export function FeedbackModal({ onClose }: { onClose: () => void }) {
  const [lang, setLang] = useState<'en'|'hi'|'mr'>('en');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const t = dictionaries[lang];

  const handleSubmit = async () => {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://rainguard-oracle.onrender.com';
      await fetch(`${API_BASE_URL}/api/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, comment, lang })
      });
      alert('Thank you!');
      onClose();
    } catch (e) {
      console.error(e);
      onClose();
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', 
      background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
    }}>
      <div className="card" style={{ width: '90%', maxWidth: '350px', background: '#0f172a' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h3 style={{ margin: 0 }}>{t.title}</h3>
          <select value={lang} onChange={(e) => setLang(e.target.value as any)} style={{ background: 'rgba(255,255,255,0.1)', color: 'white', borderRadius: '4px', border: 'none', padding: '0.2rem' }}>
            <option value="en">English</option>
            <option value="hi">हिंदी</option>
            <option value="mr">मराठी</option>
          </select>
        </div>

        <div className="input-group">
          <label>{t.rating}</label>
          <input type="range" min="1" max="5" value={rating} onChange={e => setRating(Number(e.target.value))} />
          <div style={{ textAlign: 'center' }}>{rating} Stars</div>
        </div>

        <div className="input-group">
          <label>{t.comment}</label>
          <textarea 
            rows={3} 
            value={comment} 
            onChange={e => setComment(e.target.value)}
            style={{ width: '100%', background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '0.5rem', padding: '0.5rem', boxSizing: 'border-box' }} 
          />
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem' }}>
          <button className="button" style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)' }} onClick={onClose}>Cancel</button>
          <button className="button" onClick={handleSubmit}>{t.submit}</button>
        </div>
      </div>
    </div>
  );
}
