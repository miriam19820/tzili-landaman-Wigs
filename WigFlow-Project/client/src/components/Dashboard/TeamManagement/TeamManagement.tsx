import React, { useState, useEffect } from 'react';
import './TeamManagement.css';

interface Worker {
  _id: string;
  fullName: string;
  specialty: string;
}

export const TeamManagement: React.FC = () => {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [specialty, setSpecialty] = useState('תפירה');
  const [message, setMessage] = useState({ text: '', type: '' });
  
  // מזהה אם אנחנו במצב "עריכה" (מכיל ID) או "הוספה" (null)
  const [editingId, setEditingId] = useState<string | null>(null);

  // פונקציה לשליפת רשימת העובדות מהשרת
  const fetchWorkers = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('http://localhost:5000/api/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      
      // התיקון שלנו: מוודאים שקיבלנו מערך לפני שעושים filter
      // אם השרת החזיר שגיאת ניתוק (401), זה יהפוך למערך ריק במקום להקריס את המסך
      const workersData = Array.isArray(data) ? data : (data.data || []);
      setWorkers(workersData.filter((u: any) => u.role === 'Worker'));
      
    } catch (err) {
      console.error("שגיאה בטעינת עובדות", err);
      setWorkers([]); // איפוס למערך ריק במקרה של שגיאה
    }
  };

  // טעינה ראשונית כשהקומפוננטה עולה
  useEffect(() => {
    fetchWorkers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    
    // אם יש editingId, אנחנו מעדכנים (PUT). אם אין, אנחנו יוצרים חדש (POST).
    const url = editingId 
      ? `http://localhost:5000/api/users/${editingId}` 
      : 'http://localhost:5000/api/users';
      
    const method = editingId ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          fullName,
          username: editingId ? undefined : username, 
          password: editingId ? undefined : password, 
          role: 'Worker',
          specialty
        })
      });

      if (!response.ok) throw new Error('שגיאה בשמירת הנתונים');

      setMessage({ 
        text: editingId ? '✅ פרטי העובדת עודכנו!' : '✅ עובדת חדשה נוספה!', 
        type: 'success' 
      });
      
      // איפוס וחזרה למצב רגיל
      setFullName('');
      setUsername('');
      setPassword('');
      setSpecialty('תפירה');
      setEditingId(null);
      fetchWorkers(); // רענון הטבלה

      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    } catch (error: any) {
      setMessage({ text: `❌ ${error.message}`, type: 'error' });
    }
  };

  const handleEditClick = (worker: Worker) => {
    setEditingId(worker._id);
    setFullName(worker.fullName);
    setSpecialty(worker.specialty);
    window.scrollTo({ top: 0, behavior: 'smooth' }); // גלילה נעימה לטופס
  };

  return (
    <div className="team-management-container">
      <h3 className="team-title">
        {editingId ? `✏️ עריכת פרטי: ${fullName}` : '👩‍🔧 הוספת עובדת חדשה לצוות'}
      </h3>
      
      <form onSubmit={handleSubmit} className="team-form">
        <div className="form-group">
          <label>שם מלא:</label>
          <input 
            type="text" 
            value={fullName} 
            onChange={(e) => setFullName(e.target.value)} 
            required 
            placeholder="למשל: שרה כהן"
          />
        </div>

        {!editingId && (
          <>
            <div className="form-group">
              <label>שם משתמש:</label>
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>סיסמה:</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
          </>
        )}

        <div className="form-group">
          <label>התמחות:</label>
          <select value={specialty} onChange={(e) => setSpecialty(e.target.value)}>
            <option value="התאמת שיער">התאמת שיער</option>
            <option value="תפירה">תפירה / מכונה</option>
            <option value="צבע">צבע</option>
            <option value="עבודת יד">עבודת יד</option>
            <option value="חפיפה">חפיפה</option>
            <option value="בקרת איכות">בקרת איכות (QA)</option>
          </select>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button type="submit" className="btn-submit-worker">
            {editingId ? 'שמור שינויים' : 'הוסף לצוות'}
          </button>
          {editingId && (
            <button 
              type="button" 
              className="btn-submit-worker" 
              style={{ backgroundColor: '#95a5a6' }}
              onClick={() => { setEditingId(null); setFullName(''); }}
            >
              ביטול
            </button>
          )}
        </div>

        {message.text && <div className={`message-box ${message.type}`}>{message.text}</div>}
      </form>

      <hr style={{ margin: '30px 0', border: '0', borderTop: '1px solid #eee' }} />

      <h3 className="team-title">📋 רשימת עובדות קיימות (לעריכה)</h3>
      <table className="overview-table">
        <thead>
          <tr>
            <th>שם</th>
            <th>התמחות</th>
            <th>פעולה</th>
          </tr>
        </thead>
        <tbody>
          {Array.isArray(workers) && workers.map(w => (
            <tr key={w._id}>
              <td>{w.fullName}</td>
              <td>{w.specialty}</td>
              <td>
                <button 
                  onClick={() => handleEditClick(w)}
                  style={{ padding: '4px 10px', cursor: 'pointer', backgroundColor: '#3498db', color: 'white', border: 'none', borderRadius: '4px' }}
                >
                  ערוך שם
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};