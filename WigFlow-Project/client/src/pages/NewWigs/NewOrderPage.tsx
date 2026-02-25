import React from 'react';
import { NewOrderForm } from '../../components/NewWigs/NewOrderForm/NewOrderForm';

const NewOrderPage: React.FC = () => {
  return (
    <div className="page-container">
      <h2>פתיחת הזמנת פאה חדשה</h2>
      <NewOrderForm />
    </div>
  );
};

export default NewOrderPage;