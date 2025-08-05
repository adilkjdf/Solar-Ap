import React, { useState } from 'react';
import { X, PlusCircle } from 'lucide-react';
import FormField from './FormField';
import SelectField from './SelectField';
import { Design } from '../types/project';

interface NewDesignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (designName: string, clonedDesignId?: string) => void;
  existingDesigns: Design[];
}

const NewDesignModal: React.FC<NewDesignModalProps> = ({ isOpen, onClose, onSubmit, existingDesigns }) => {
  const [designName, setDesignName] = useState('');
  const [clonedDesignId, setClonedDesignId] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!designName.trim()) {
      setError('Design name is required.');
      return;
    }
    onSubmit(designName, clonedDesignId);
    setDesignName('');
    setClonedDesignId('');
    setError('');
    onClose();
  };

  const handleClose = () => {
    setDesignName('');
    setClonedDesignId('');
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  const designOptions = existingDesigns.map(d => ({ value: d.id, label: d.name }));

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={handleClose} />
        
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg">
          <div className="flex items-center justify-between p-6 border-b bg-gray-50 rounded-t-2xl">
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              <PlusCircle className="w-6 h-6 mr-3 text-cyan-500" />
              Create New Design
            </h2>
            <button onClick={handleClose} className="p-2 hover:bg-gray-200 rounded-lg transition-colors">
              <X className="w-6 h-6 text-gray-500" />
            </button>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="p-6">
              <p className="text-sm text-gray-600 mb-4">
                Create a new design from scratch or clone an existing one to get started faster.
              </p>
              <FormField
                label="Design Name"
                id="designName"
                value={designName}
                onChange={setDesignName}
                error={error}
                required
                placeholder="e.g., Rooftop Array V1"
              />
              
              {existingDesigns.length > 0 && (
                <SelectField
                  label="Clone Existing Design (Optional)"
                  id="cloneDesign"
                  value={clonedDesignId}
                  onChange={setClonedDesignId}
                  options={designOptions}
                />
              )}
            </div>
            
            <div className="flex items-center justify-end p-6 border-t bg-gray-50 space-x-3 rounded-b-2xl">
              <button
                type="button"
                onClick={handleClose}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors"
              >
                Create Design
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default NewDesignModal;