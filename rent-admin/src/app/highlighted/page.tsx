import React from 'react';
import HighlightedProducts from '../../components/HighlightedProducts';
import Layout from '../../components/Layout';

const HighlightedProductsPage: React.FC = () => {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <HighlightedProducts />
      </div>
    </Layout>
  );
};

export default HighlightedProductsPage;
