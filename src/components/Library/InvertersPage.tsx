import React from 'react';
import { Zap } from 'lucide-react';

const InvertersPage: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-900 flex items-center mb-8">
        <Zap className="w-8 h-8 mr-3 text-cyan-500" />
        Inverter Library
      </h1>
      <div className="text-center py-20 bg-white rounded-lg shadow-sm border">
        <Zap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Coming Soon</h3>
        <p className="text-gray-500">The inverter library is under construction.</p>
      </div>
    </div>
  );
};

export default InvertersPage;