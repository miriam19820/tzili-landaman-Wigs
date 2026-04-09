import React, { useEffect, useState } from 'react';
import './WorkersLoadStatus.css';

interface Worker {
  _id: string;
  fullName: string;
  specialty: string;
  activeWigs?: number;
}

export const WorkersLoadStatus: React.FC = () => {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    
    // מושכים במקביל את העובדות, הפאות החדשות, והתיקונים
    Promise.all([
      fetch('http://localhost:5000/api/users', { headers: { Authorization: `Bearer ${token}` } }).then(res => res.json()),
      fetch('http://localhost:5000/api/wigs', { headers: { Authorization: `Bearer ${token}` } }).then(res => res.json()),
      fetch('http://localhost:5000/api/repairs/dashboard-view', { headers: { Authorization: `Bearer ${token}` } }).then(res => res.json())
    ])
      .then(([usersData, wigsData, repairsData]) => { 
        const workersList = Array.isArray(usersData) ? usersData : (usersData.data || []);
        const newWigs = Array.isArray(wigsData.data) ? wigsData.data : [];
        const repairs = Array.isArray(repairsData.data) ? repairsData.data : [];
        
        const allActiveWigs = [...newWigs, ...repairs];

        // חישוב עומס חכם בזמן אמת
        const workersWithLoad = workersList.map((worker: any) => {
          let count = 0;
          allActiveWigs.forEach(wig => {
            // בודק אם העובדת נמצאת במערך הייצור או בתיקון יחיד
            if (wig.assignedWorkers && wig.assignedWorkers.some((w: any) => w._id === worker._id)) count++;
            if (wig.assignedTo && (wig.assignedTo._id === worker._id || wig.assignedTo === worker.username)) count++;
          });
          return { ...worker, activeWigs: count };
        });

        setWorkers(workersWithLoad); 
        setLoading(false); 
      })
      .catch((err) => {
        console.error("שגיאה בטעינת עומס עובדות:", err);
        setWorkers([]); 
        setLoading(false); 
      });
  }, []);

  const workersOnly = Array.isArray(workers) 
    ? workers.filter(w => w.specialty !== 'ניהול') 
    : [];

  return (
    <div className="workers-container">
      <h2 className="workers-title">👩‍💼 עומס עבודה - מצב נוכחי בזמן אמת</h2>
      {loading ? (
        <p className="loading-text">טוען נתונים...</p>
      ) : workersOnly.length === 0 ? (
        <p className="loading-text">אין עובדות להצגה כרגע</p>
      ) : (
        <div className="workers-grid">
          {workersOnly.map(worker => (
            <div key={worker._id} className="worker-card">
              <div className="worker-name">{worker.fullName}</div>
              <div className="worker-specialty">{worker.specialty}</div>
              <span className="worker-count" style={{ backgroundColor: worker.activeWigs && worker.activeWigs > 0 ? '#27ae60' : '#6f42c1'}}>
                {worker.activeWigs ?? 0} פאות פעילות
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};