import React, { useState, useEffect } from 'react';
import { supabase } from '../../integrations/supabase/client';
import { Module } from '../../types/project';
import { Upload, Package, Search, Plus, Eye, Trash2 } from 'lucide-react';
import ModuleUploadModal from './ModuleUploadModal';
import ModulePreviewModal from './ModulePreviewModal';

interface ModulesPageProps {
  onSaveModule: (moduleData: Module) => void;
}

const ModulesPage: React.FC<ModulesPageProps> = ({ onSaveModule }) => {
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [moduleToPreview, setModuleToPreview] = useState<Module | null>(null);

  useEffect(() => {
    fetchModules();
  }, []);

  const fetchModules = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('modules').select('*').order('created_at', { ascending: false });
      if (error) {
        console.error('Error fetching modules:', error);
        setModules([]);
      } else {
        setModules(data || []);
      }
    } catch (error) {
      console.error('Failed to fetch modules:', error);
      setModules([]);
    }
    setLoading(false);
  };

  const handleSaveAndRefresh = async (moduleData: Module) => {
    try {
      await onSaveModule(moduleData);
      fetchModules(); // Re-fetch modules to update the list
    } catch (error) {
      console.error('Failed to save module:', error);
    }
  };

  const handlePreview = (module: Module) => {
    setModuleToPreview(module);
    setIsPreviewModalOpen(true);
  };

  const handleDelete = async (moduleId: string) => {
    if (window.confirm('Are you sure you want to delete this module?')) {
      try {
        const { error } = await supabase.from('modules').delete().eq('id', moduleId);
        if (error) {
          console.error('Error deleting module:', error);
          alert('Failed to delete module.');
        } else {
          setModules(prev => prev.filter(m => m.id !== moduleId));
        }
      } catch (error) {
        console.error('Failed to delete module:', error);
        alert('Failed to delete module.');
      }
    }
  };

  return (
    <>
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <Package className="w-8 h-8 mr-3 text-orange-500" />
              Module Library
            </h1>
            <p className="text-gray-600 mt-1">Manage and upload solar panel module data.</p>
          </div>
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="bg-orange-500 text-white px-5 py-2.5 rounded-lg hover:bg-orange-600 transition-colors flex items-center space-x-2"
          >
            <Upload className="w-5 h-5" />
            <span>Upload .PAN File</span>
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-4 border-b flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-800">All Modules</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search modules..."
                className="pl-10 pr-4 py-2 border rounded-lg w-64 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            {loading ? (
              <p className="text-center py-12 text-gray-500">Loading modules...</p>
            ) : modules.length === 0 ? (
              <div className="text-center py-20">
                <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No modules found</h3>
                <p className="text-gray-500 mb-6">Upload your first module data file to get started.</p>
                <button
                  onClick={() => setIsUploadModalOpen(true)}
                  className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 
                             transition-colors flex items-center space-x-2 mx-auto"
                >
                  <Plus className="w-4 h-4" />
                  <span>Upload Module</span>
                </button>
              </div>
            ) : (
              <table className="w-full text-sm text-left text-gray-600">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3">Model Name</th>
                    <th scope="col" className="px-6 py-3">Manufacturer</th>
                    <th scope="col" className="px-6 py-3">Technology</th>
                    <th scope="col" className="px-6 py-3">Max Power (PMP)</th>
                    <th scope="col" className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {modules.map(module => (
                    <tr key={module.id} className="bg-white border-b hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-900">{module.model_name}</td>
                      <td className="px-6 py-4">{module.manufacturer || 'N/A'}</td>
                      <td className="px-6 py-4">{module.technology || 'N/A'}</td>
                      <td className="px-6 py-4">{module.max_power_pmp ? `${module.max_power_pmp} W` : 'N/A'}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button onClick={() => handlePreview(module)} className="p-2 text-gray-500 hover:text-cyan-600 hover:bg-gray-100 rounded-md" title="Preview Module">
                            <Eye className="w-5 h-5" />
                          </button>
                          <button onClick={() => handleDelete(module.id)} className="p-2 text-gray-500 hover:text-red-600 hover:bg-gray-100 rounded-md" title="Delete Module">
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
      <ModuleUploadModal 
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSave={handleSaveAndRefresh}
      />
      {isPreviewModalOpen && moduleToPreview && (
        <ModulePreviewModal
          isOpen={isPreviewModalOpen}
          onClose={() => setIsPreviewModalOpen(false)}
          panFile={moduleToPreview.raw_pan_data!}
          fileName={moduleToPreview.model_name}
        />
      )}
    </>
  );
};

export default ModulesPage;