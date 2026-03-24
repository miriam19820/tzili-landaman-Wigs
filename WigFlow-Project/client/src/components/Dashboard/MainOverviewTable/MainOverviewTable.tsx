import React, { useEffect, useState } from 'react';
import './MainOverviewTable.css';

interface Wig {
  _id: string;
  orderCode: string;
  customer: { firstName: string; lastName: string };
  currentStage: string;
  assignedWorker: { fullName: string };
  targetDate: string;
  isUrgent: boolean;
}

export const MainOverviewTable: React.FC = () => {
  const [wigs, setWigs] = useState<Wig[]>([]);
  const [loading, setLoading] = useState(true);
  
  // משתנים חדשים לחיפוש וסינון
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('הכל');

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch('http://localhost:5000/api/wigs', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => { setWigs(data.data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  // --- לוגיקת הסינון החכמה ---
  const filteredWigs = wigs.filter(wig => {
    // 1. בדיקת חיפוש (לפי שם לקוחה או קוד הזמנה)
    const fullName = `${wig.customer?.firstName} ${wig.customer?.lastName}`.toLowerCase();
    const matchesSearch = 
      fullName.includes(searchTerm.toLowerCase()) || 
      wig.orderCode?.toLowerCase().includes(searchTerm.toLowerCase());

    // 2. בדיקת סטטוס
    const matchesStatus = statusFilter === 'הכל' || wig.currentStage === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="overview-container">
      <h2 className="overview-title">📋 סקירה כללית - כל הפאות הפעילות</h2>

      {/* שורת כלי חיפוש וסינון */}
      <div className="filter-bar">
        <input 
          type="text" 
          placeholder="חפשי לפי שם לקוחה או קוד..." 
          className="search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        
        <select 
          className="status-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="הכל">כל השלבים</option>
          <option value="שיער">שיער</option>
          <option value="תפירה">תפירה</option>
          <option value="צבע">צבע</option>
          <option value="QC">בקרת איכות (QC)</option>
          <option value="מוכן">מוכן למסירה</option>
        </select>
      </div>

      {loading ? (
        <p className="loading-text">טוען נתונים...</p>
      ) : filteredWigs.length === 0 ? (
        <p className="loading-text">לא נמצאו פאות התואמות לחיפוש</p>
      ) : (
        <table className="overview-table">
          <thead>
            <tr>
              <th>קוד הזמנה</th>
              <th>שם לקוחה</th>
              <th>שלב נוכחי</th>
              <th>עובדת מוקצית</th>
              <th>תאריך יעד</th>
              <th>דחיפות</th>
            </tr>
          </thead>
          <tbody>
            {filteredWigs.map(wig => (
              <tr key={wig._id}>
                <td>{wig.orderCode || '-'}</td>
                <td>{wig.customer?.firstName} {wig.customer?.lastName}</td>
                <td><span className="badge-stage">{wig.currentStage}</span></td>
                <td>{wig.assignedWorker?.fullName || '-'}</td>
                <td>{wig.targetDate ? new Date(wig.targetDate).toLocaleDateString('he-IL') : '-'}</td>
                <td>{wig.isUrgent ? <span className="badge-urgent">דחוף!</span> : <span className="badge-normal">רגיל</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};