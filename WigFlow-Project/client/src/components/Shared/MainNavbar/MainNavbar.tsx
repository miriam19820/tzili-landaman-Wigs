import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

export const MainNavbar: React.FC = () => {
  const navigate = useNavigate();
  
  // שליפת נתוני המשתמש מהאחסון המקומי
  const userRaw = localStorage.getItem('user');
  const user = userRaw ? JSON.parse(userRaw) : null;

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (!user) return null; // אם אין משתמש מחובר, אל תציג תפריט

  return (
    <nav style={navStyle}>
      <div style={linksContainer}>
        {/* קישורים למנהלת בלבד */}
        {user.role === 'Admin' && (
          <>
            <Link style={linkStyle} to="/admin/all-active">לוח בקרה מרכזי 📊</Link>
            <Link style={linkStyle} to="/repairs/new">אבחון תיקון חדש 🛠️</Link>
          </>
        )}

        {/* קישור לעובדת (וגם למנהלת שרוצה לראות) */}
        <Link 
          style={linkStyle} 
          to={`/repairs/tasks/${user._id || user.id}`}
        >
          המשימות שלי 📋
        </Link>
      </div>

      <div style={userSection}>
        <span style={{ marginLeft: '15px', fontWeight: 'bold' }}>שלום, {user.username} 👋</span>
        <button onClick={handleLogout} style={logoutBtn}>התנתקות</button>
      </div>
    </nav>
  );
};

// עיצוב בסיסי כדי שזה יראה טוב
const navStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '10px 30px',
  background: '#6f42c1',
  color: 'white',
  marginBottom: '20px',
  boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
};

const linksContainer: React.CSSProperties = {
  display: 'flex',
  gap: '20px'
};

const linkStyle: React.CSSProperties = {
  color: 'white',
  textDecoration: 'none',
  fontWeight: '500'
};

const userSection: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center'
};

const logoutBtn: React.CSSProperties = {
  background: '#dc3545',
  color: 'white',
  border: 'none',
  padding: '5px 12px',
  borderRadius: '4px',
  cursor: 'pointer'
};