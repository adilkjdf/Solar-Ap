import React, { useState, useEffect } from 'react';
import { ProjectData, Design, FieldSegment, Module } from '../types/project';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import DesignEditorSidebar from './DesignEditorSidebar';
import MapDrawingLayer from './MapDrawingLayer';
import FieldSegmentLayer from './FieldSegmentLayer';
import { ArrowLeft, ChevronDown } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import { LatLngTuple } from 'leaflet';
import { supabase } from '../integrations/supabase/client';
import MaptalksViewer from './MaptalksViewer';

interface DesignEditorPageProps {
  project: ProjectData;
  design: Design;
  onBack: () => void;
}

const MAPTILER_API_KEY = 'aTChQEvBqKVcP0AXd2bH';

const MAP_OPTIONS = [
  { value: 'maptiler-satellite', label: 'MapTiler Satellite', url: `https://api.maptiler.com/maps/satellite/{z}/{x}/{y}.jpg?key=${MAPTILER_API_KEY}` },
  { value: 'maptiler-streets', label: 'MapTiler Streets', url: `https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=${MAPTILER_API_KEY}` },
  { value: 'maptalk-satellite', label: 'MapTalk Satellite (High Resolution)', url: 'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}' },
  { value: 'maptalk-hybrid', label: 'MapTalk Hybrid (Latest View)', url: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}' },
  { value: 'maptalk-terrain', label: 'MapTalk Terrain (Advanced)', url: 'https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}' },
  { value: 'maptalk-streets', label: 'MapTalk Streets', url: 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}' },
];

const getMapAttribution = (mapType: string) => {
  if (mapType.startsWith('maptiler')) return '&copy; <a href="https://www.maptiler.com/copyright/" target="_blank">MapTiler</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors';
  if (mapType.startsWith('maptalk')) return '&copy; Google Maps';
  return '';
};

const MapResizer: React.FC<{ isSidebarOpen: boolean }> = ({ isSidebarOpen }) => {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => { map.invalidateSize(); }, 300);
    return () => clearTimeout(timer);
  }, [isSidebarOpen, map]);
  return null;
};

const DesignEditorPage: React.FC<DesignEditorPageProps> = ({ project, design, onBack }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingPoints, setDrawingPoints] = useState<LatLngTuple[]>([]);
  const [drawingArea, setDrawingArea] = useState(0);
  const [fieldSegments, setFieldSegments] = useState<FieldSegment[]>([]);
  const [selectedSegment, setSelectedSegment] = useState<FieldSegment | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [selectedMapType, setSelectedMapType] = useState('maptiler-satellite');
  const [isMapDropdownOpen, setIsMapDropdownOpen] = useState(false);

  const isMaptalksView = selectedMapType === 'maptalk-satellite';

  useEffect(() => {
    setFieldSegments(design.field_segments || []);
  }, [design]);

  useEffect(() => {
    const fetchModules = async () => {
      const { data, error } = await supabase.from('modules').select('*');
      if (error) console.error('Error fetching modules:', error);
      else setModules(data || []);
    };
    fetchModules();
  }, []);

  const saveFieldSegments = async (segmentsToSave: FieldSegment[]) => {
    try {
      const { error } = await supabase
        .from('designs')
        .update({ field_segments: segmentsToSave, last_modified: new Date().toISOString() })
        .eq('id', design.id);

      if (error) {
        console.error('Error saving field segments:', error);
      }
    } catch (error) {
      console.error('Failed to save field segments:', error);
    }
  };

  const handleStartDrawing = () => {
    if (isMaptalksView) {
      alert("Drawing is not supported in the 3D view. Please switch to a 2D map to create or edit field segments.");
      return;
    }
    setIsDrawing(true);
    setSelectedSegment(null);
    setDrawingPoints([]);
  };

  const handleStopDrawing = () => {
    setIsDrawing(false);
    if (drawingPoints.length > 2) {
      const newSegment: FieldSegment = {
        id: new Date().toISOString(),
        points: drawingPoints,
        area: 0,
        nameplate: 0,
        moduleCount: 0,
        azimuth: 180,
        description: `Field Segment ${fieldSegments.length + 1}`,
        rackingType: 'Fixed Tilt',
        moduleTilt: 10,
        orientation: 'Portrait',
        rowSpacing: 2,
        moduleSpacing: 0.041,
        setback: 0,
        surfaceHeight: 0,
        rackingHeight: 0,
        frameSizeUp: 1,
        frameSizeWide: 1,
        frameSpacing: 0,
        spanRise: 0,
        alignment: 'center',
      };
      const updatedSegments = [...fieldSegments, newSegment];
      setFieldSegments(updatedSegments);
      saveFieldSegments(updatedSegments);
      setSelectedSegment(newSegment);
    }
    setDrawingPoints([]);
  };

  const handleClearDrawing = () => setDrawingPoints([]);

  const handleUpdateSegment = (id: string, updates: Partial<FieldSegment>) => {
    const updatedSegments = fieldSegments.map(seg => seg.id === id ? { ...seg, ...updates } : seg);
    setFieldSegments(updatedSegments);
    saveFieldSegments(updatedSegments);
    if (selectedSegment?.id === id) {
      const newSelectedSegment = updatedSegments.find(seg => seg.id === id);
      setSelectedSegment(newSelectedSegment || null);
    }
  };

  const handleDeleteSegment = (id: string) => {
    const updatedSegments = fieldSegments.filter(seg => seg.id !== id);
    setFieldSegments(updatedSegments);
    saveFieldSegments(updatedSegments);
    if (selectedSegment?.id === id) {
      setSelectedSegment(null);
    }
  };

  const mapCenter: [number, number] = project.coordinates ? [project.coordinates.lat, project.coordinates.lng] : [37.7749, -122.4194];

  const currentMapOption = MAP_OPTIONS.find(option => option.value === selectedMapType) || MAP_OPTIONS[0];

  const handleMapTypeChange = (mapType: string) => {
    setSelectedMapType(mapType);
    setIsMapDropdownOpen(false);
  };

  return (
    <div className="flex h-full w-full bg-gray-100">
      <DesignEditorSidebar
        design={design}
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        isDrawing={isDrawing}
        onStartDrawing={handleStartDrawing}
        onStopDrawing={handleStopDrawing}
        onClearDrawing={handleClearDrawing}
        drawingArea={drawingArea}
        modules={modules}
        fieldSegments={fieldSegments}
        selectedSegment={selectedSegment}
        onSelectSegment={setSelectedSegment}
        onUpdateSegment={handleUpdateSegment}
        onDeleteSegment={handleDeleteSegment}
        isDrawingDisabled={isMaptalksView}
      />
      <div className="flex-1 relative">
        <div className="absolute top-0 left-0 z-[1000] p-4">
          <button onClick={onBack} className="bg-white/80 backdrop-blur-sm text-gray-800 px-4 py-2 rounded-lg font-semibold hover:bg-white transition-colors flex items-center space-x-2 shadow-md">
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Project</span>
          </button>
        </div>
        <div className="absolute top-0 right-0 z-[1000] p-4">
          <div className="relative">
            <button
              onClick={() => setIsMapDropdownOpen(!isMapDropdownOpen)}
              className="bg-white/80 backdrop-blur-sm text-gray-800 px-4 py-2 rounded-lg font-semibold hover:bg-white transition-colors flex items-center space-x-2 shadow-md"
            >
              <span>{currentMapOption.label}</span>
              <ChevronDown className="w-4 h-4" />
            </button>
            {isMapDropdownOpen && (
              <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border py-1 z-[1001]">
                {MAP_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleMapTypeChange(option.value)}
                    className={`w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors ${
                      selectedMapType === option.value ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {isMaptalksView ? (
          <MaptalksViewer
            project={project}
            fieldSegments={fieldSegments}
            selectedSegment={selectedSegment}
            onSelectSegment={setSelectedSegment}
          />
        ) : (
          <MapContainer center={mapCenter} zoom={19} maxZoom={24} className="h-full w-full" scrollWheelZoom={true} doubleClickZoom={false}>
            <TileLayer 
              url={currentMapOption.url} 
              attribution={getMapAttribution(selectedMapType)} 
              maxNativeZoom={20} 
              maxZoom={24} 
              key={selectedMapType}
            />
              <MapResizer isSidebarOpen={isSidebarOpen} />
              
              {isDrawing && (
                <MapDrawingLayer 
                  points={drawingPoints} 
                  onPointsChange={setDrawingPoints} 
                  onShapeComplete={handleStopDrawing}
                  onAreaChange={setDrawingArea}
                />
              )}

              {fieldSegments.map(segment => (
                <FieldSegmentLayer 
                  key={segment.id} 
                  segment={segment} 
                  modules={modules} 
                  onUpdate={handleUpdateSegment}
                  onSelect={() => setSelectedSegment(segment)}
                />
              ))}
          </MapContainer>
        )}
      </div>
    </div>
  );
};

export default DesignEditorPage;