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
    fetch('http://localhost:5000/api/users', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => { setWorkers(data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const workersOnly = workers.filter(w => w.specialty !== 'ניהול');

  return (
    <div className="workers-container">
      <h2 className="workers-title">👩‍💼 עומס עבודה - צוות</h2>
      {loading ? (
        <p className="loading-text">טוען נתונים...</p>
      ) : workersOnly.length === 0 ? (
        <p className="loading-text">אין עובדות במערכת</p>
      ) : (
        <div className="workers-grid">
          {workersOnly.map(worker => (
            <div key={worker._id} className="worker-card">
              <div className="worker-name">{worker.fullName}</div>
              <div className="worker-specialty">{worker.specialty}</div>
              <span className="worker-count">{worker.activeWigs ?? 0} פאות פעילות</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
