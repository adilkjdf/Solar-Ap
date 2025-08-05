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
  is3DView?: boolean;
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

const FieldSegmentLayer: React.FC<FieldSegmentLayerProps> = ({ segment, modules, onUpdate, onSelect, is3DView = false }) => {
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

  const renderHeightMarker = (position: LatLngTuple, height: number) => {
    const icon = divIcon({
      className: 'leaflet-div-icon-transparent',
      html: `<div class="bg-yellow-500 text-black text-xs font-bold px-2 py-1 rounded shadow-lg border border-yellow-600">${height.toFixed(1)} ft</div>`
    });
    return <Marker key={`height-${position.toString()}`} position={position} icon={icon} />;
  };

  // Calculate building outline color based on surface height
  const getBuildingColor = () => {
    const height = segment.surfaceHeight || 0;
    if (height === 0) return '#ca8a04'; // Default yellow
    const intensity = Math.min(height / 50, 1); // Normalize to 0-1 based on 50ft max
    const red = Math.floor(255 * intensity);
    const green = Math.floor(255 * (1 - intensity * 0.5));
    const blue = 0;
    return `rgb(${red}, ${green}, ${blue})`;
  };

  return (
    <>
      {/* Building base outline */}
      <Polygon 
        positions={segment.points} 
        pathOptions={{ color: getBuildingColor(), weight: 3, fill: false, dashArray: is3DView ? '5, 5' : undefined }} 
        eventHandlers={{ click: onSelect }}
      />

      {/* 3D Building visualization - side walls */}
      {is3DView && segment.surfaceHeight && segment.surfaceHeight > 0 && (
        <>
          {segment.points.map((point, index) => {
            const nextPoint = segment.points[(index + 1) % segment.points.length];
            // Create vertical wall effect by drawing multiple offset polygons
            const wallPolygons = [];
            const steps = Math.min(Math.floor(segment.surfaceHeight / 2), 10); // Max 10 steps for performance
            
            for (let i = 0; i < steps; i++) {
              const offset = (i + 1) * 0.00001; // Small lat/lng offset to simulate height
              const wallPoints = [
                [point[0] - offset, point[1] - offset],
                [nextPoint[0] - offset, nextPoint[1] - offset],
                [nextPoint[0], nextPoint[1]],
                [point[0], point[1]]
              ];
              wallPolygons.push(
                <Polygon
                  key={`wall-${segment.id}-${index}-${i}`}
                  positions={wallPoints as LatLngTuple[]}
                  pathOptions={{
                    color: '#8b4513',
                    weight: 1,
                    fillColor: '#d2691e',
                    fillOpacity: 0.3 - (i * 0.02),
                  }}
                />
              );
            }
            return wallPolygons;
          })}
        </>
      )}

      {/* Rooftop surface (elevated) */}
      {segment.surfaceHeight && segment.surfaceHeight > 0 && (
        <Polygon
          positions={segment.points.map(p => [
            p[0] - (segment.surfaceHeight || 0) * 0.00001,
            p[1] - (segment.surfaceHeight || 0) * 0.00001
          ] as LatLngTuple)}
          pathOptions={{
            color: '#fbbf24',
            weight: 2,
            fillColor: '#fef3c7',
            fillOpacity: 0.4,
          }}
          eventHandlers={{ click: onSelect }}
        />
      )}

      {/* Buildable area on rooftop */}
      <Polygon
        positions={(insetPolygon.length > 0 ? insetPolygon : segment.points).map(p => [
          p[0] - (segment.surfaceHeight || 0) * 0.00001,
          p[1] - (segment.surfaceHeight || 0) * 0.00001
        ] as LatLngTuple)}
        pathOptions={{ color: 'transparent', weight: 0, fillColor: '#f97316', fillOpacity: 0.3 }}
        eventHandlers={{ click: onSelect }}
      />

      {/* Green setback area (donut shape) if setback is defined */}
      {insetPolygon.length > 0 && (
        <Polygon 
          positions={[
            segment.points.map(p => [
              p[0] - (segment.surfaceHeight || 0) * 0.00001,
              p[1] - (segment.surfaceHeight || 0) * 0.00001
            ] as LatLngTuple),
            insetPolygon.map(p => [
              p[0] - (segment.surfaceHeight || 0) * 0.00001,
              p[1] - (segment.surfaceHeight || 0) * 0.00001
            ] as LatLngTuple)
          ]}
          pathOptions={{ color: 'transparent', weight: 0, fillColor: '#a7f3d0', fillOpacity: 0.5 }}
        />
      )}

      {/* Render the blue module polygons on top */}
      {segment.moduleLayout?.map((modulePolygon, i) => (
        <Polygon 
          key={i} 
          positions={modulePolygon.map(p => [
            p[0] - (segment.surfaceHeight || 0) * 0.00001,
            p[1] - (segment.surfaceHeight || 0) * 0.00001
          ] as LatLngTuple)} 
          pathOptions={{ color: 'white', weight: 1, fillColor: '#3b82f6', fillOpacity: 0.9 }} 
        />
      ))}
      
      {/* Draggable vertices and length markers */}
      {segment.points.map((p, i) => (
        <DraggableMarker key={i} position={p} onDrag={(newLatLng: any) => handleMarkerDrag(i, newLatLng)} />
      ))}
      {segment.points.map((p1, i) => {
        const p2 = segment.points[(i + 1) % segment.points.length];
        return renderLengthMarker(p1, p2, segment.points);
      })}
      
      {/* Height markers for 3D visualization */}
      {is3DView && segment.surfaceHeight && segment.surfaceHeight > 0 && (
        <>
          {segment.points.map((point, index) => {
            if (index % 2 === 0) { // Show height marker on every other vertex to avoid clutter
              return renderHeightMarker(point, segment.surfaceHeight || 0);
            }
            return null;
          })}
        </>
      )}
    </>
  );
};

export default FieldSegmentLayer;