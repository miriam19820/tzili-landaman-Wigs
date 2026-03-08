import React, { useState } from 'react';

// ייבוא קומפוננטות קיימות (מפתחות 2 ו-3) - לא נגענו
import { ProductionStation } from './components/NewWigs/ProductionStation/ProductionStation';
import { NewOrderForm } from './components/NewWigs/NewOrderForm/NewOrderForm';

// --- הייבוא החדש שלך (מפתחת 4 - שבוע 3) ---
import { ServiceOrderForm } from './components/ServicesAndQA/ServiceOrderForm';
import { QADashboard } from './components/ServicesAndQA/QADashboard';

// עדכון ה-Type של העמודים כדי לכלול את האופציות החדשות
type Page = 'newOrder' | 'production' | 'serviceOrder' | 'qa';

function App() {
  // ה-State המקורי שלך מורחב
  const [currentPage, setCurrentPage] = useState<Page>('newOrder');

  return (
    <div className="App" dir="rtl">
      {/* הכותרת המקורית שלך */}
      <h1 style={{ textAlign: 'center', fontFamily: 'sans-serif' }}>WigFlow</h1>
      
      <nav style={{ padding: '20px', backgroundColor: '#f5f5f5', marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        
        {/* כפתור "פאה חדשה" - נשאר בדיוק כמו שהיה */}
        <button 
          onClick={() => setCurrentPage('newOrder')}
          style={{ 
            marginRight: '10px', 
            padding: '10px 20px', 
            backgroundColor: currentPage === 'newOrder' ? '#007bff' : '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          פאה חדשה
        </button>

        {/* כפתור "תחנת ייצור" - נשאר בדיוק כמו שהיה */}
        <button 
          onClick={() => setCurrentPage('production')}
          style={{ 
            padding: '10px 20px', 
            backgroundColor: currentPage === 'production' ? '#007bff' : '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          תחנת ייצור
        </button>

        {/* --- כפתורים חדשים לשבוע 3 (התוספת שלך) --- */}
        <button 
          onClick={() => setCurrentPage('serviceOrder')}
          style={{ 
            padding: '10px 20px', 
            backgroundColor: currentPage === 'serviceOrder' ? '#28a745' : '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          הזמנת שירות
        </button>

        <button 
          onClick={() => setCurrentPage('qa')}
          style={{ 
            padding: '10px 20px', 
            backgroundColor: currentPage === 'qa' ? '#dc3545' : '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          בקרת איכות (QA)
        </button>
      </nav>
      
      {/* הצגת העמודים הקיימים */}
      {currentPage === 'newOrder' && <NewOrderForm />}
      {currentPage === 'production' && <ProductionStation />}

      {/* הצגת העמודים החדשים שלך */}
      {currentPage === 'serviceOrder' && <ServiceOrderForm />}
      {currentPage === 'qa' && <QADashboard />}
    </div>
  );
}

export default App;