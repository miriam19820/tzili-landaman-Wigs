import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './StaffAllocator.css';

interface StaffAllocatorProps {
  category: string;
  onSelect: (workerId: string) => void;
}

export const StaffAllocator: React.FC<StaffAllocatorProps> = ({ category, onSelect }) => {
  const [workers, setWorkers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    axios.get(`/repairs/available-workers/${category}`)
      .then(res => {
        if (res.data.success) setWorkers(res.data.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [category]);

  return (
    <select onChange={(e) => onSelect(e.target.value)} className="staff-select" disabled={loading}>
      <option value="">{loading ? 'טוען עובדות...' : `בחרי עובדת ל${category}...`}</option>
      {workers.map(w => (
        <option key={w.workerId} value={w.workerId}>
          {w.workerName} (עומס: {w.load} משימות)
        </option>
      ))}
    </select>
  );
};