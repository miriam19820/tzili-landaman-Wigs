import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './MainOverviewTable.css';

interface DashboardWig {
  _id: string;
  wigCode: string;
  customerName: string;
  overallStatus: string;
  currentStation: string;
  assignedTo?: any;      
  assignedWorkers?: any; 
  isUrgent: boolean;
  type?: 'wig' | 'repair';
}

export const MainOverviewTable: React.FC = () => {
  const [wigs, setWigs] = useState<DashboardWig[]>([]);
  const [loading, setLoading] = useState(true);
  const [wigToDelete, setWigToDelete] = useState<string | null>(null);
  const [adminCode, setAdminCode] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);


  const fetchAllData = () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    
    Promise.all([
      fetch('http://localhost:5000/api/wigs', { headers: { Authorization: `Bearer ${token}` } }).then(res => res.json()),
      fetch('http://localhost:5000/api/repairs/dashboard-view', { headers: { Authorization: `Bearer ${token}` } }).then(res => res.json())
    ])
      .then(([wigsData, repairsData]) => { 
        // מוסיפים שדה type כדי שנדע אם זו פאה או תיקון בעת המחיקה
        const newWigs = Array.isArray(wigsData.data) ? wigsData.data.map((w: any) => ({...w, type: 'wig'})) : [];
        const repairs = Array.isArray(repairsData.data) ? repairsData.data.map((r: any) => ({...r, type: 'repair'})) : [];
        
        setWigs([...newWigs, ...repairs]); 
        setLoading(false); 
      })
      .catch(err => {
        console.error("שגיאה בטעינה:", err);
        setWigs([]);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  
  const handleDeleteClick = (id: string) => {
    setWigToDelete(id);
    setAdminCode('');
  };
  const cancelDelete = () => {
    setWigToDelete(null);
    setAdminCode('');
  };


  const confirmDelete = async () => {
    if (!adminCode) {
      alert("יש להזין קוד מנהל");
      return;
    }

    const item = wigs.find(w => w._id === wigToDelete);
    if (!item) return;

    setIsDeleting(true);
    const token = localStorage.getItem('token');
    

    const endpoint = item.type === 'repair' 
      ? `http://localhost:5000/api/repairs/${wigToDelete}` 
      : `http://localhost:5000/api/wigs/${wigToDelete}`;

    try {
    
      await axios.delete(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
        data: { adminCode: adminCode } 
      });

      alert('המחיקה בוצעה בהצלחה');
      setWigToDelete(null);
      fetchAllData();
    } catch (error: any) {
      const msg = error.response?.data?.message || 'שגיאה במחיקה. ודא שקוד המנהל נכון.';
      alert(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  const renderWorkers = (wig: DashboardWig) => {
    const workers = wig.assignedWorkers || wig.assignedTo;
    if (!workers) return 'לא שובץ';
    if (Array.isArray(workers)) return workers.map((w: any) => w.username || w.fullName || w).join(', ');
    return workers.username || workers.fullName || workers.toString();
  };

  return (
    <div className="overview-container">
      <div className="overview-header">
        <h2>סקירה כללית — פאות ותיקונים</h2>
        {!loading && <span className="overview-count">{wigs.length} פריטים</span>}
      </div>

      {wigToDelete && (
        <div className="zili-modal-overlay">
          <div className="zili-modal">
            <h3>⚠️ מחיקה לצמיתות</h3>
            <p>הזן קוד מנהל כדי לאשר את המחיקה</p>
            <input
              type="text"
              className="admin-code-input"
              value={adminCode}
              onChange={(e) => setAdminCode(e.target.value)}
              placeholder="קוד מנהל"
              autoFocus
            />
            <div className="admin-modal-actions">
              <button className="btn-danger" onClick={confirmDelete} disabled={isDeleting}>
                {isDeleting ? 'מוחק...' : 'אשר מחיקה'}
              </button>
              <button className="btn-secondary" onClick={cancelDelete}>ביטול</button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="loading-state">טוען נתונים...</div>
      ) : (
        <div className="zili-table-wrapper">
        <table className="zili-table">
          <thead>
            <tr>
              <th>קוד</th>
              <th>לקוחה</th>
              <th>סטטוס</th>
              <th>תחנה</th>
              <th>עובדת</th>
              <th>דחיפות</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {wigs.map((wig) => (
              <tr key={wig._id}>
                <td><strong>{wig.wigCode}</strong></td>
                <td>{wig.customerName}</td>
                <td><span className="badge badge-stage">{wig.overallStatus}</span></td>
                <td>{wig.currentStation}</td>
                <td>{renderWorkers(wig)}</td>
                <td>
                  <span className={wig.isUrgent ? 'badge badge-urgent' : 'badge badge-normal'}>
                    {wig.isUrgent ? 'דחוף' : 'רגיל'}
                  </span>
                </td>
                <td>
                  <button className="btn-delete-wig" onClick={() => handleDeleteClick(wig._id)} title="מחיקה">
                    ✕
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      )}
    </div>
  );
};