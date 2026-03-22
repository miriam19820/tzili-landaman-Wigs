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

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch('http://localhost:5000/api/wigs', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => { setWigs(data.data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="overview-container">
      <h2 className="overview-title">📋 סקירה כללית - כל הפאות הפעילות</h2>
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
              <th>שלב נוכחי</th>
              <th>עובדת מוקצית</th>
              <th>תאריך יעד</th>
              <th>דחיפות</th>
            </tr>
          </thead>
          <tbody>
            {wigs.map(wig => (
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
