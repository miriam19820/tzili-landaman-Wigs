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
    Promise.all([
      fetch('http://localhost:5000/api/users', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch('http://localhost:5000/api/wigs', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch('http://localhost:5000/api/repairs/dashboard-view', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json())
    ])
      .then(([usersData, wigsData, repairsData]) => {
        const workersList = Array.isArray(usersData) ? usersData : (usersData.data || []);
        const allActive = [
          ...(Array.isArray(wigsData.data) ? wigsData.data : []),
          ...(Array.isArray(repairsData.data) ? repairsData.data : [])
        ];
        const withLoad = workersList.map((worker: any) => {
          let count = 0;
          allActive.forEach(wig => {
            if (wig.assignedWorkers?.some((w: any) => w._id === worker._id)) count++;
            if (wig.assignedTo && (wig.assignedTo._id === worker._id || wig.assignedTo === worker.username)) count++;
          });
          return { ...worker, activeWigs: count };
        });
        setWorkers(withLoad);
        setLoading(false);
      })
      .catch(() => { setWorkers([]); setLoading(false); });
  }, []);

  const workersOnly = Array.isArray(workers) ? workers.filter(w => w.specialty !== 'ניהול') : [];

  return (
    <div className="workers-container">
      <div className="workers-title">עומס עבודה — מצב נוכחי</div>
      {loading ? (
        <p className="loading-text">טוען נתונים...</p>
      ) : workersOnly.length === 0 ? (
        <p className="loading-text">אין עובדות להצגה</p>
      ) : (
        <div className="workers-grid">
          {workersOnly.map(worker => (
            <div key={worker._id} className="worker-card">
              <div className="worker-name">{worker.fullName}</div>
              <div className="worker-specialty">{worker.specialty}</div>
              <span className={`worker-count ${worker.activeWigs && worker.activeWigs > 0 ? 'busy' : 'free'}`}>
                {worker.activeWigs ?? 0} פאות פעילות
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
