import React, { useState } from 'react';


import { ProductionStation } from './components/NewWigs/ProductionStation/ProductionStation';
import { NewOrderForm } from './components/NewWigs/NewOrderForm/NewOrderForm';


import { ServiceOrderForm } from './components/ServicesAndQA/ServiceOrderForm';
import { QADashboard } from './components/ServicesAndQA/QADashboard';


type Page = 'newOrder' | 'production' | 'serviceOrder' | 'qa';

function App() {
 
  const [currentPage, setCurrentPage] = useState<Page>('newOrder');

  return (
    <div className="App" dir="rtl">
     
      <h1 style={{ textAlign: 'center', fontFamily: 'sans-serif' }}>WigFlow</h1>
      
      <nav style={{ padding: '20px', backgroundColor: '#f5f5f5', marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        
        
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
      
      {currentPage === 'newOrder' && <NewOrderForm />}
      {currentPage === 'production' && <ProductionStation />}

      {currentPage === 'serviceOrder' && <ServiceOrderForm />}
      {currentPage === 'qa' && <QADashboard />}
    </div>
  );
}

export default App;