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
  const [editingId, setEditingId] = useState<string | null>(null);

  const fetchWorkers = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('http://localhost:5000/api/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('שגיאה בשליפת נתוני העובדים');
      const data = await res.json();
      const workersData = Array.isArray(data) ? data : (data.data || []);
      setWorkers(workersData.filter((u: any) => u.role === 'Worker'));
    } catch (err) {
      console.error('שגיאה בטעינת עובדות', err);
      setWorkers([]);
    }
  };

  useEffect(() => { fetchWorkers(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const url = editingId
      ? `http://localhost:5000/api/users/${editingId}`
      : 'http://localhost:5000/api/users';
    const method = editingId ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          fullName,
          username: editingId ? undefined : username,
          password: editingId ? undefined : password,
          role: 'Worker',
          specialty
        })
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'שגיאה בשמירת הנתונים');
      }
      setMessage({ text: editingId ? 'פרטי העובדת עודכנו בהצלחה' : 'עובדת חדשה נוספה בהצלחה', type: 'success' });
      setFullName(''); setUsername(''); setPassword(''); setSpecialty('תפירה'); setEditingId(null);
      fetchWorkers();
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    } catch (error: any) {
      setMessage({ text: error.message, type: 'error' });
    }
  };

  const handleEditClick = (worker: Worker) => {
    setEditingId(worker._id);
    setFullName(worker.fullName);
    setSpecialty(worker.specialty);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancel = () => { setEditingId(null); setFullName(''); setSpecialty('תפירה'); };

  return (
    <div className="team-management-container">

      {/* טופס הוספה/עריכה */}
      <div className="team-title">
        {editingId ? `עריכת פרטי: ${fullName}` : 'הוספת עובדת חדשה לצוות'}
      </div>

      <div className="team-form-card">
        <form onSubmit={handleSubmit} className="team-form">
          <div className="form-group">
            <label>שם מלא</label>
            <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required placeholder="למשל: שרה כהן" />
          </div>

          {!editingId && (
            <>
              <div className="form-group">
                <label>שם משתמש</label>
                <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>סיסמה</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
            </>
          )}

          <div className="form-group">
            <label>התמחות</label>
            <select value={specialty} onChange={(e) => setSpecialty(e.target.value)}>
              <option value="התאמת שיער">התאמת שיער</option>
              <option value="תפירה">תפירה / מכונה</option>
              <option value="צבע">צבע</option>
              <option value="עבודת יד">עבודת יד</option>
              <option value="חפיפה">חפיפה</option>
              <option value="בקרת איכות">בקרת איכות</option>
            </select>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-submit-worker">
              {editingId ? 'שמור שינויים' : 'הוסף לצוות'}
            </button>
            {editingId && (
              <button type="button" className="btn-cancel-worker" onClick={handleCancel}>ביטול</button>
            )}
          </div>

          {message.text && <div className={`message-box ${message.type}`}>{message.text}</div>}
        </form>
      </div>

      <hr className="team-divider" />

      {/* טבלת עובדות */}
      <div className="team-title">רשימת עובדות</div>
      <table className="team-table">
        <thead>
          <tr>
            <th>שם</th>
            <th>התמחות</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {Array.isArray(workers) && workers.map(w => (
            <tr key={w._id}>
              <td>{w.fullName}</td>
              <td><span className="specialty-badge">{w.specialty}</span></td>
              <td>
                <button className="btn-edit-worker" onClick={() => handleEditClick(w)} title="ערוך">✎</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
