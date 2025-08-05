import React from 'react';
import { ArrowLeft, Trash2 } from 'lucide-react';

interface DrawingControlsProps {
  area: number;
  onBack: () => void;
  onClear: () => void;
}

const DrawingControls: React.FC<DrawingControlsProps> = ({ area, onBack, onClear }) => {
  return (
    <div className="p-4 h-full flex flex-col bg-white">
      <h3 className="text-lg font-semibold text-gray-800 mb-2">Create New Field Segment</h3>
      <p className="text-sm text-gray-600 mb-4">
        Click on the map to create a field segment. A field segment is a valid area to place modules.
      </p>
      <div className="flex space-x-2 mb-4">
        <button
          onClick={onBack}
          className="px-3 py-1 bg-gray-200 text-gray-800 rounded-md text-sm font-semibold hover:bg-gray-300 flex items-center space-x-1"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
        <button
          onClick={onClear}
          className="px-3 py-1 bg-gray-200 text-gray-800 rounded-md text-sm font-semibold hover:bg-gray-300 flex items-center space-x-1"
        >
          <Trash2 className="w-4 h-4" />
          <span>Clear Current Shape</span>
        </button>
      </div>
      <p className="text-sm text-gray-600 mb-4">
        Press <kbd className="px-2 py-1.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg">escape</kbd> to clear the current shape.
      </p>
      <div className="border-t pt-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Area:</span>
          <span className="font-medium text-gray-800">{area.toFixed(2)} ft²</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Modules:</span>
          <span className="font-medium text-gray-800">0</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Nameplate:</span>
          <span className="font-medium text-gray-800">0</span>
        </div>
      </div>
      <div className="mt-auto bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded">
        <p className="text-sm text-yellow-800">
          <span className="font-bold">Tip:</span> While drawing a field segment, hold down the <kbd className="px-2 py-1 text-xs font-semibold text-yellow-900 bg-yellow-200 rounded-md">shift key</kbd> to have new lines automatically snap to angles.
        </p>
      </div>
    </div>
  );
};

export default DrawingControls;