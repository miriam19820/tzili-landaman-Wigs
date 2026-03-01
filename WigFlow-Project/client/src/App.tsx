import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';

// ייבוא הקומפוננטות
import { ProductionStation } from './components/NewWigs/ProductionStation/ProductionStation';
import { NewOrderForm } from './components/NewWigs/NewOrderForm/NewOrderForm';
import { LoginForm } from './components/Auth/LoginForm/LoginForm';

// תפריט ניווט שמוצג רק למי שמחובר
const Navigation = () => {
  const location = useLocation();
  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : null;
  
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  return (
    <nav style={{ padding: '20px', backgroundColor: '#f5f5f5', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div>
        {/* המזכירה רואה הכל, העובדת רואה רק את התחנה שלה */}
        {(user?.role === 'Admin' || user?.role === 'Secretary') && (
          <Link 
            to="/"
            style={{ 
              marginRight: '10px', padding: '10px 20px', color: 'white', border: 'none', borderRadius: '5px', textDecoration: 'none',
              backgroundColor: location.pathname === '/' ? '#007bff' : '#6c757d'
            }}
          >
            פאה חדשה
          </Link>
        )}
        
        <Link 
          to="/production"
          style={{ 
            padding: '10px 20px', color: 'white', border: 'none', borderRadius: '5px', textDecoration: 'none',
            backgroundColor: location.pathname === '/production' ? '#007bff' : '#6c757d'
          }}
        >
          תחנת ייצור
        </Link>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
        <span style={{ fontWeight: 'bold' }}>שלום, {user?.username} ({user?.role})</span>
        <button 
          onClick={handleLogout}
          style={{ padding: '8px 15px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
        >
          התנתק
        </button>
      </div>
    </nav>
  );
};

// קומפוננטת עזר להגנה על נתיבים - אם אין טוקן, נזרוק למסך התחברות
const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  const token = localStorage.getItem('token');
  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : null;

  return (
    <Router>
      <div className="App" dir="rtl">
        {/* הכותרת והניווט יוצגו רק אם המשתמש מחובר */}
        {token && <h1 style={{ textAlign: 'center', fontFamily: 'sans-serif', color: '#004085', marginTop: '20px' }}>WigFlow System</h1>}
        {token && <Navigation />}
        
        <Routes>
          {/* מסך ההתחברות הפתוח לכולם - אם המשתמשת כבר מחוברת, היא תועבר ישירות למערכת! */}
          <Route 
            path="/login" 
            element={token ? <Navigate to={user?.role === 'Worker' ? "/production" : "/"} replace /> : <LoginForm />} 
          />

          {/* נתיבים מוגנים (דורשים התחברות) */}
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <NewOrderForm />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/production" 
            element={
              <ProtectedRoute>
                <ProductionStation />
              </ProtectedRoute>
            } 
          />
          
          {/* נתיב ברירת מחדל אם מקישים כתובת לא קיימת */}
          <Route path="*" element={<Navigate to={token ? "/" : "/login"} replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;