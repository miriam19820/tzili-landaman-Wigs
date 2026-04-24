import React, { useState } from 'react'; // הוספתי useState לכל מקרה
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import axios from 'axios';

// 1. הגדרות Axios (נשאר בדיוק אותו דבר)
axios.defaults.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 2. ייבוא הקומפוננטות (וידאתי שכל ה-Imports קיימים)
import { ProductionStation } from './components/NewWigs/ProductionStation/ProductionStation';
import { NewOrderForm } from './components/NewWigs/NewOrderForm/NewOrderForm';
import { LoginForm } from './components/Auth/LoginForm/LoginForm';
import { DiagnosisChecklist } from './components/Repairs/DiagnosisChecklist/DiagnosisChecklist';
import { RepairWorkerList } from './components/Repairs/RepairWorkerList/RepairWorkerList';
import { QuickCustomerRegister } from './components/Repairs/QuickCustomerRegister/QuickCustomerRegister';
import { ServiceOrderForm } from './components/ServicesAndQA/ServiceOrderForm/ServiceOrderForm';
import { QADashboard } from './components/ServicesAndQA/QADashboard/QADashboard';
import { MainOverviewTable } from './components/Dashboard/MainOverviewTable/MainOverviewTable';
import { WorkersLoadStatus } from './components/Dashboard/WorkersLoadStatus/WorkersLoadStatus';

// --- קומפוננטת הניווט (כאן הוספתי את הכפתור שלך) ---
const Navigation = () => {
  const location = useLocation();
  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : null;
  
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  const linkStyle = (path: string) => ({
    padding: '10px 20px', 
    color: 'white', 
    border: 'none', 
    borderRadius: '5px', 
    textDecoration: 'none',
    backgroundColor: location.pathname === path ? '#6f42c1' : '#6c757d',
    fontWeight: 'bold' as const,
    transition: 'background-color 0.3s'
  });

  return (
    <nav style={{ padding: '20px', backgroundColor: '#f5f5f5', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: '8px' }}>
      <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
        {user?.role === 'Admin' && (
          <>
            <Link to="/" style={linkStyle('/')}>הזמנת פאה חדשה</Link>
            <Link to="/repairs/new" style={linkStyle('/repairs/new')}>קבלת פאה לתיקון</Link>
            {/* הוספתי את הקישור שלך כאן */}
            <Link to="/service/new" style={linkStyle('/service/new')}>הזמנת שירות</Link>
            <Link to="/dashboard" style={linkStyle('/dashboard')}>דאשבורד עומס</Link>
          </>
        )}

        {(user?.role === 'Worker' || user?.role === 'Admin') && (
          <>
            <Link to="/production" style={linkStyle('/production')}>תחנת ייצור</Link>
            <Link to="/repairs/tasks" style={linkStyle('/repairs/tasks')}>תחנת תיקונים</Link>
          </>
        )}

        {(user?.role === 'QC' || user?.role === 'Admin') && (
          <Link to="/qa" style={linkStyle('/qa')}>בקרת איכות (QA)</Link>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
        <span style={{ fontWeight: 'bold' }}>שלום, {user?.username} ({user?.role})</span>
        <button onClick={handleLogout} style={{ padding: '8px 15px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>התנתק</button>
      </div>
    </nav>
  );
};

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;
  return children;
};

function App() {
  const token = localStorage.getItem('token');
  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : null;

  return (
    <Router>
      <div className="App" dir="rtl" style={{ fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif' }}>
        {token && <h1 style={{ textAlign: 'center', color: '#6f42c1', marginTop: '20px' }}>מערכת WigFlow ✂️</h1>}
        {token && <Navigation />}
        
        <div style={{ padding: '0 20px' }}>
          <Routes>
            <Route path="/login" element={token ? <Navigate to={user?.role === 'Worker' ? "/repairs/tasks" : "/"} replace /> : <LoginForm />} />
            
            {/* נתיבי מנהלת */}
            <Route path="/" element={<ProtectedRoute><NewOrderForm /></ProtectedRoute>} />
            <Route path="/repairs/new" element={<ProtectedRoute><DiagnosisChecklist /></ProtectedRoute>} />
            <Route path="/repairs/quick-register" element={<ProtectedRoute><QuickCustomerRegister /></ProtectedRoute>} />
            
            {/* שילבתי את הדפים שלך כאן בתוך ה-Routes */}
            <Route path="/service/new" element={<ProtectedRoute><ServiceOrderForm /></ProtectedRoute>} />
            <Route path="/qa" element={<ProtectedRoute><QADashboard /></ProtectedRoute>} />

            <Route path="/dashboard" element={<ProtectedRoute><div><MainOverviewTable /><WorkersLoadStatus /></div></ProtectedRoute>} />

            {/* נתיבי עובדת ייצור */}
            <Route path="/production" element={<ProtectedRoute><ProductionStation /></ProtectedRoute>} />
            
            {/* נתיב תחנת תיקונים */}
            <Route path="/repairs/tasks" element={
              <ProtectedRoute>
                <RepairWorkerList workerId={user?.id || user?._id || ''} />
              </ProtectedRoute>
            } />
            
            <Route path="*" element={<Navigate to={token ? "/" : "/login"} replace />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;