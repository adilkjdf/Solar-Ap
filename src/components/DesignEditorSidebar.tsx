import React, { useState, useEffect } from 'react';
import { Design, Module, FieldSegment } from '../types/project';
import { Plus, PanelLeftClose, PanelLeftOpen, Trash2, ArrowLeft, Send } from 'lucide-react';
import DrawingControls from './DrawingControls';
import SelectField from './SelectField';
import FormField from './FormField';

interface DesignEditorSidebarProps {
  design: Design;
  isOpen: boolean;
  onToggle: () => void;
  isDrawing: boolean;
  onStartDrawing: () => void;
  onStopDrawing: () => void;
  onClearDrawing: () => void;
  drawingArea: number;
  modules: Module[];
  fieldSegments: FieldSegment[];
  selectedSegment: FieldSegment | null;
  onSelectSegment: (segment: FieldSegment | null) => void;
  onUpdateSegment: (id: string, updates: Partial<FieldSegment>) => void;
  onDeleteSegment: (id:string) => void;
}

const FEET_PER_METER = 3.28084;

const DesignEditorSidebar: React.FC<DesignEditorSidebarProps> = ({ 
  design, 
  isOpen, 
  onToggle,
  isDrawing,
  onStartDrawing,
  onStopDrawing,
  onClearDrawing,
  drawingArea,
  modules,
  fieldSegments,
  selectedSegment,
  onSelectSegment,
  onUpdateSegment,
  onDeleteSegment
}) => {
  const moduleOptions = modules.map(m => ({ value: m.id, label: `${m.manufacturer} ${m.model_name}` }));
  const orientationOptions = [{ value: 'Landscape', label: 'Landscape (Horizontal)' }, { value: 'Portrait', label: 'Portrait (Vertical)' }];
  const rackingOptions = [{ value: 'Fixed Tilt', label: 'Fixed Tilt Racking' }, { value: 'Flush Mount', label: 'Flush Mount' }];

  const [editedSegment, setEditedSegment] = useState<FieldSegment | null>(null);

  useEffect(() => {
    setEditedSegment(selectedSegment);
  }, [selectedSegment]);

  const handleFieldChange = (updates: Partial<FieldSegment>) => {
    if (editedSegment) {
      const newSegmentState = { ...editedSegment, ...updates };
      setEditedSegment(newSegmentState);
      onUpdateSegment(editedSegment.id, newSegmentState);
    }
  };

  const calculateGCR = () => {
    if (!editedSegment || !editedSegment.moduleId || !editedSegment.rowSpacing) return 0;
    const module = modules.find(m => m.id === editedSegment.moduleId);
    if (!module || !module.width || !module.height) return 0;

    const moduleLengthInTiltDirection = editedSegment.orientation === 'Landscape' ? module.width : module.height;
    const gcr = (moduleLengthInTiltDirection * FEET_PER_METER) / editedSegment.rowSpacing;
    return gcr;
  };

  const gcr = calculateGCR();

  if (!isOpen) {
    return (
      <div className="bg-white p-2 border-r h-screen">
        <button onClick={onToggle} className="p-2 hover:bg-gray-100 rounded-md">
          <PanelLeftOpen className="w-6 h-6 text-gray-600" />
        </button>
      </div>
    );
  }

  if (isDrawing) {
    return (
      <aside className="w-96 bg-white border-r shadow-lg flex flex-col h-screen">
        <DrawingControls
          area={drawingArea}
          onBack={onStopDrawing}
          onClear={onClearDrawing}
        />
      </aside>
    );
  }

  if (selectedSegment && editedSegment) {
    return (
      <aside className="w-96 bg-white border-r shadow-lg flex flex-col h-screen text-sm">
        <div className="p-4 border-b flex-shrink-0">
          <div className="flex justify-between items-center mb-2">
            <button onClick={() => onSelectSegment(null)} className="text-sm text-blue-600 hover:underline flex items-center space-x-1">
              <ArrowLeft size={14} />
              <span>back to list</span>
            </button>
            <div className="flex items-center space-x-2">
              <button className="p-2 text-gray-500 hover:text-gray-800 rounded-md" title="Send">
                <Send size={16} />
              </button>
              <button onClick={() => onDeleteSegment(selectedSegment.id)} className="p-2 text-gray-500 hover:text-red-600 rounded-md" title="Delete Segment">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
          <h2 className="text-lg font-bold text-gray-800">Field Segment {editedSegment.description || ''}</h2>
          <p className="text-gray-600">Modules: {selectedSegment.moduleCount} ({selectedSegment.nameplate.toFixed(2)} kW) <a href="#" className="text-blue-600">(set max kWp)</a></p>
          <p className="text-gray-600">Area: {selectedSegment.area.toFixed(1)} ft²</p>
        </div>
        <div className="flex-grow p-4 overflow-y-auto space-y-4">
          <FormField label="Description" id="seg-desc" value={editedSegment.description || ''} onChange={val => handleFieldChange({ description: val })} />
          <SelectField label="" id="seg-module" value={editedSegment.moduleId || ''} onChange={val => handleFieldChange({ moduleId: val })} options={moduleOptions} />
          <SelectField label="Racking" id="seg-racking" value={editedSegment.rackingType || ''} onChange={val => handleFieldChange({ rackingType: val as any })} options={rackingOptions} />
          
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Surface Height" id="seg-surf-h" type="number" value={editedSegment.surfaceHeight || 0} onChange={val => handleFieldChange({ surfaceHeight: parseFloat(val) })} />
            <FormField label="Racking Height" id="seg-rack-h" type="number" value={editedSegment.rackingHeight || 0} onChange={val => handleFieldChange({ rackingHeight: parseFloat(val) })} />
            <FormField label="Module Azimuth" id="seg-azimuth" type="number" value={editedSegment.azimuth} onChange={val => handleFieldChange({ azimuth: parseFloat(val) })} />
            <FormField label="Module Tilt" id="seg-tilt" type="number" value={editedSegment.moduleTilt || 0} onChange={val => handleFieldChange({ moduleTilt: parseFloat(val) })} />
          </div>
          <a href="#" className="text-blue-600 text-xs">+ Add Independent Tilt</a>

          <div className="p-3 bg-gray-50 rounded-lg border mt-4">
            <h4 className="font-semibold mb-2 text-gray-700">Automatic Layout Rules</h4>
            <div className="grid grid-cols-3 gap-2 items-center mb-2">
              <label className="text-gray-600">Frame Size</label>
              <FormField id="frame-up" type="number" label="" value={editedSegment.frameSizeUp || 1} onChange={v => handleFieldChange({ frameSizeUp: parseFloat(v) })} />
              <FormField id="frame-wide" type="number" label="" value={editedSegment.frameSizeWide || 1} onChange={v => handleFieldChange({ frameSizeWide: parseFloat(v) })} />
            </div>
            <SelectField label="Default Orientation" id="seg-orientation" value={editedSegment.orientation || ''} onChange={val => handleFieldChange({ orientation: val as any })} options={orientationOptions} />
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Row Spacing (ft)" id="seg-row-spacing" type="number" value={editedSegment.rowSpacing || 0} onChange={val => handleFieldChange({ rowSpacing: parseFloat(val) })} />
              <FormField label="Span / rise" id="span-rise" type="number" value={editedSegment.spanRise || 0} onChange={val => handleFieldChange({ spanRise: parseFloat(val) })} />
              <FormField label="Module Spacing (ft)" id="seg-module-spacing" type="number" value={editedSegment.moduleSpacing || 0} step={0.01} onChange={val => handleFieldChange({ moduleSpacing: parseFloat(val) })} />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">GCR</label>
                <input type="text" readOnly value={gcr.toFixed(2)} className="w-full p-3 border rounded-lg bg-gray-100" />
              </div>
              <FormField label="Frame Spacing (ft)" id="frame-spacing" type="number" value={editedSegment.frameSpacing || 0} onChange={val => handleFieldChange({ frameSpacing: parseFloat(val) })} />
            </div>
            <FormField label="Setback (ft)" id="setback" type="number" value={editedSegment.setback || 0} onChange={val => handleFieldChange({ setback: parseFloat(val) })} />
          </div>
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-96 bg-white border-r shadow-lg flex flex-col h-screen">
      <div className="p-4 border-b flex-shrink-0">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">{design.name}</h2>
          <button onClick={onToggle} className="p-2 hover:bg-gray-100 rounded-md"><PanelLeftClose className="w-6 h-6 text-gray-600" /></button>
        </div>
      </div>
      <div className="flex-grow p-4 overflow-y-auto space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-gray-800">Field Segments</h3>
          <button onClick={onStartDrawing} className="px-3 py-1 bg-gray-200 text-gray-800 rounded-md text-sm font-semibold hover:bg-gray-300 flex items-center space-x-1"><Plus className="w-4 h-4" /><span>New</span></button>
        </div>
        <div className="space-y-2">
          {fieldSegments.length === 0 ? (
            <div className="text-center p-6 text-gray-500 border-2 border-dashed rounded-lg">No field segments created.</div>
          ) : (
            fieldSegments.map((segment) => (
              <div key={segment.id} onClick={() => onSelectSegment(segment)} className="border rounded-lg p-3 bg-white hover:bg-gray-50 cursor-pointer">
                <div className="flex justify-between items-center">
                  <h4 className="font-semibold text-gray-800">{segment.description || `Field Segment ${segment.id.substring(0,4)}`}</h4>
                  <button onClick={(e) => { e.stopPropagation(); onDeleteSegment(segment.id); }} className="p-1 text-gray-400 hover:text-red-600"><Trash2 size={16} /></button>
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  {segment.moduleCount} modules ({segment.nameplate.toFixed(2)} kW)
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </aside>
  );
};

export default DesignEditorSidebar;