import React, { useEffect, useState } from 'react';
import './MainOverviewTable.css';

interface DashboardWig {
  wigCode: string;
  customerName: string;
  overallStatus: string;
  currentStation: string;
  assignedTo?: any;      
  assignedWorkers?: any; 
  isUrgent: boolean;
}

export const MainOverviewTable: React.FC = () => {
  const [wigs, setWigs] = useState<DashboardWig[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    
    // מושכים נתונים במקביל גם ממחלקת התיקונים וגם ממחלקת הייצור!
    Promise.all([
      fetch('http://localhost:5000/api/wigs', { headers: { Authorization: `Bearer ${token}` } }).then(res => res.json()),
      fetch('http://localhost:5000/api/repairs/dashboard-view', { headers: { Authorization: `Bearer ${token}` } }).then(res => res.json())
    ])
      .then(([wigsData, repairsData]) => { 
        const newWigs = Array.isArray(wigsData.data) ? wigsData.data : [];
        const repairs = Array.isArray(repairsData.data) ? repairsData.data : [];
        
        // מחברים את שתי הרשימות לטבלה אחת שמראה הכל
        setWigs([...newWigs, ...repairs]); 
        setLoading(false); 
      })
      .catch(err => {
        console.error("שגיאה בטעינת הנתונים:", err);
        setWigs([]);
        setLoading(false);
      });
  }, []);

  const renderWorkers = (wig: DashboardWig) => {
    const workers = wig.assignedWorkers || wig.assignedTo;
    if (!workers || workers.length === 0) return 'לא שובץ';
    
    if (Array.isArray(workers)) {
      return workers.map((w: any) => w.fullName || w.username || w).join(', ');
    }
    
    if (typeof workers === 'object') {
      return workers.fullName || workers.username || 'לא שובץ';
    }
    
    return workers.toString();
  };

  return (
    <div className="overview-container">
      <h2 className="overview-title">📋 סקירה כללית - כל הפאות הפעילות במערכת (ייצור ותיקונים)</h2>
      {loading ? (
        <p className="loading-text">טוען נתונים...</p>
      ) : wigs.length === 0 ? (
        <p className="loading-text">אין פאות פעילות במערכת</p>
      ) : (
        <table className="overview-table">
          <thead>
            <tr>
              <th>קוד הזמנה</th>
              <th>שם לקוחה</th>
              <th>סטטוס כללי</th>
              <th>תחנה נוכחית</th>
              <th>עובדת מוקצית</th>
              <th>דחיפות</th>
            </tr>
          </thead>
          <tbody>
            {wigs.map((wig, index) => (
              <tr key={wig.wigCode || index}>
                <td>{wig.wigCode || '-'}</td>
                <td>{wig.customerName || '-'}</td>
                <td><span className="badge-stage">{wig.overallStatus}</span></td>
                <td>{wig.currentStation || '-'}</td>
                <td style={{ fontWeight: 'bold', color: '#2c3e50' }}>{renderWorkers(wig)}</td>
                <td>
                  {wig.isUrgent ? (
                    <span className="badge-urgent">דחוף!</span>
                  ) : (
                    <span className="badge-normal">רגיל</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};