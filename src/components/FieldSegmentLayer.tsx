import React, { useEffect, useState } from 'react';
import { useMap, Polygon, Marker } from 'react-leaflet';
import { FieldSegment, Module } from '../types/project';
import { calculatePolygonArea, calculateAdvancedModuleLayout, calculateDistanceInFeet, getMidpoint, calculateInsetPolygon, isPointInPolygon } from '../utils/geometry';
import { divIcon, LeafletEvent, LatLngTuple, Point, latLng } from 'leaflet';

interface FieldSegmentLayerProps {
  segment: FieldSegment;
  modules: Module[];
  onUpdate: (id: string, updates: Partial<FieldSegment>) => void;
  onSelect: () => void;
}

const DraggableMarker: React.FC<{ position: any, onDrag: any }> = ({ position, onDrag }) => {
  return (
    <Marker
      position={position}
      draggable={true}
      eventHandlers={{
        drag: (e: LeafletEvent) => onDrag(e.target.getLatLng()),
      }}
      icon={divIcon({
        className: 'bg-orange-500 border-2 border-white rounded-full shadow-lg',
        iconSize: [12, 12],
      })}
    />
  );
};

const FieldSegmentLayer: React.FC<FieldSegmentLayerProps> = ({ segment, modules, onUpdate, onSelect }) => {
  const map = useMap();
  const [insetPolygon, setInsetPolygon] = useState<LatLngTuple[]>([]);

  useEffect(() => {
    const area = calculatePolygonArea(segment.points, map);
    const module = modules.find(m => m.id === segment.moduleId);

    if (module) {
      const { layout, count, nameplate, azimuth } = calculateAdvancedModuleLayout(segment, module, map);
      onUpdate(segment.id, { area, moduleLayout: layout, moduleCount: count, nameplate, azimuth });
    } else if (segment.moduleCount > 0 || segment.moduleLayout?.length) {
      onUpdate(segment.id, { area, moduleLayout: [], moduleCount: 0, nameplate: 0 });
    } else {
      if (Math.abs(area - segment.area) > 0.1) {
        onUpdate(segment.id, { area });
      }
    }
  }, [segment, modules, map, onUpdate]);

  useEffect(() => {
    if (segment.setback && segment.setback > 0 && segment.points.length > 2) {
      const inset = calculateInsetPolygon(segment.points, segment.setback, map);
      setInsetPolygon(inset);
    } else {
      setInsetPolygon([]);
    }
  }, [segment.points, segment.setback, map]);

  const handleMarkerDrag = (index: number, newLatLng: { lat: number, lng: number }) => {
    const newPoints = [...segment.points];
    newPoints[index] = [newLatLng.lat, newLatLng.lng];
    onUpdate(segment.id, { points: newPoints });
  };

  const renderLengthMarker = (p1: LatLngTuple, p2: LatLngTuple, polygonPoints: LatLngTuple[]) => {
    const length = calculateDistanceInFeet(p1, p2, map);
    const midpointLatLng = getMidpoint(p1, p2);

    const p1_container = map.latLngToContainerPoint(p1);
    const p2_container = map.latLngToContainerPoint(p2);
    const midpoint_container = map.latLngToContainerPoint(midpointLatLng);

    const dx = p2_container.x - p1_container.x;
    const dy = p2_container.y - p1_container.y;

    const normalVec = new Point(-dy, dx);
    const dist = normalVec.distanceTo(new Point(0, 0));
    const normal = dist > 0 ? normalVec.divideBy(dist) : new Point(0, 0);

    const offset = 20;
    
    let offsetPoint = midpoint_container.add(normal.multiplyBy(offset));

    if (polygonPoints.length > 2) {
        const polygonContainerPoints = polygonPoints.map(p => map.latLngToContainerPoint(latLng(p)));
        if (isPointInPolygon(offsetPoint, polygonContainerPoints)) {
            offsetPoint = midpoint_container.subtract(normal.multiplyBy(offset));
        }
    }

    const finalPosition = map.containerPointToLatLng(offsetPoint);

    const icon = divIcon({
        className: 'leaflet-div-icon-transparent',
        html: `<div class="text-white text-sm font-bold" style="text-shadow: 0 0 3px black, 0 0 3px black;">${length.toFixed(1)} ft</div>`
    });
    return <Marker key={`length-${p1.toString()}-${p2.toString()}`} position={finalPosition} icon={icon} />;
  };

  return (
    <>
      {/* Main outline of the segment */}
      <Polygon 
        positions={segment.points} 
        pathOptions={{ color: '#ca8a04', weight: 2, fill: false }} 
        eventHandlers={{ click: onSelect }}
      />

      {/* Orange background for the buildable area (or whole area if no setback) */}
      <Polygon
        positions={insetPolygon.length > 0 ? insetPolygon : segment.points}
        pathOptions={{ color: 'transparent', weight: 0, fillColor: '#f97316', fillOpacity: 0.2 }}
        eventHandlers={{ click: onSelect }}
      />

      {/* Green setback area (donut shape) if setback is defined */}
      {insetPolygon.length > 0 && (
        <Polygon 
          positions={[segment.points, insetPolygon]}
          pathOptions={{ color: 'transparent', weight: 0, fillColor: '#a7f3d0', fillOpacity: 0.5 }}
        />
      )}

      {/* Render the blue module polygons on top */}
      {segment.moduleLayout?.map((modulePolygon, i) => (
        <Polygon key={i} positions={modulePolygon} pathOptions={{ color: 'white', weight: 1, fillColor: '#3b82f6', fillOpacity: 0.8 }} />
      ))}
      
      {/* Draggable vertices and length markers */}
      {segment.points.map((p, i) => (
        <DraggableMarker key={i} position={p} onDrag={(newLatLng: any) => handleMarkerDrag(i, newLatLng)} />
      ))}
      {segment.points.map((p1, i) => {
        const p2 = segment.points[(i + 1) % segment.points.length];
        return renderLengthMarker(p1, p2, segment.points);
      })}
    </>
  );
};

export default FieldSegmentLayer;