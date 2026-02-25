import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';

// ייבוא הקומפוננטות שכבר יש לך
import { ProductionStation } from './components/NewWigs/ProductionStation/ProductionStation';
import { NewOrderForm } from './components/NewWigs/NewOrderForm/NewOrderForm';

// יצרתי לך קומפוננטת ניווט פנימית קטנה כדי שנוכל לשמור על העיצוב המקורי של הכפתורים
const Navigation = () => {
  const location = useLocation();
  
  return (
    <nav style={{ padding: '20px', backgroundColor: '#f5f5f5', marginBottom: '20px', display: 'flex' }}>
      <Link 
        to="/"
        style={{ 
          marginRight: '10px', 
          padding: '10px 20px', 
          backgroundColor: location.pathname === '/' ? '#007bff' : '#6c757d',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
          textDecoration: 'none'
        }}
      >
        פאה חדשה
      </Link>
      <Link 
        to="/production"
        style={{ 
          padding: '10px 20px', 
          backgroundColor: location.pathname === '/production' ? '#007bff' : '#6c757d',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
          textDecoration: 'none'
        }}
      >
        תחנת ייצור
      </Link>
    </nav>
  );
};

function App() {
  return (
    <Router>
      <div className="App" dir="rtl">
        <h1 style={{ textAlign: 'center', fontFamily: 'sans-serif' }}>WigFlow</h1>
        
        {/* תפריט הניווט שלנו */}
        <Navigation />
        
        {/* אזור חילוף המסכים לפי כתובת ה-URL */}
        <Routes>
          <Route path="/" element={<NewOrderForm />} />
          <Route path="/production" element={<ProductionStation />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;