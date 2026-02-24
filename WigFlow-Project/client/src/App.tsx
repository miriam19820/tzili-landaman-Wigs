import React, { useState } from 'react';

import { ProductionStation } from './components/NewWigs/ProductionStation/ProductionStation';
import { NewOrderForm } from './components/NewWigs/NewOrderForm/NewOrderForm';

function App() {
  const [currentPage, setCurrentPage] = useState<'newOrder' | 'production'>('newOrder');

  return (
    <div className="App" dir="rtl">
      <nav style={{ padding: '20px', backgroundColor: '#f5f5f5', marginBottom: '20px' }}>
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
      </nav>
      
      {currentPage === 'newOrder' && <NewOrderForm />}
      {currentPage === 'production' && <ProductionStation />}
    </div>
  );
}

export default App;