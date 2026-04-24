import React from 'react';
import { ProductionStation } from '../../components/NewWigs/ProductionStation/ProductionStation';

const ProductionStationPage: React.FC = () => {
  return (
    <div className="page-container">
      <h2>תחנת עבודה - פס ייצור פאות</h2>
      <ProductionStation />
    </div>
  );
};

export default ProductionStationPage;