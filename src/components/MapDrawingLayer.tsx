import React, { useState, useEffect, useCallback } from 'react';
import { useMap, Polygon, Polyline, CircleMarker, Marker } from 'react-leaflet';
import { LatLngTuple, divIcon, Point, latLng } from 'leaflet';
import { calculateDistanceInFeet, getMidpoint, getSnappedPoint, calculatePolygonArea, isPointInPolygon } from '../utils/geometry';

interface MapDrawingLayerProps {
  points: LatLngTuple[];
  onPointsChange: (points: LatLngTuple[]) => void;
  onShapeComplete: () => void;
  onAreaChange: (area: number) => void;
}

const MapDrawingLayer: React.FC<MapDrawingLayerProps> = ({ points, onPointsChange, onShapeComplete, onAreaChange }) => {
  const map = useMap();
  const [mousePos, setMousePos] = useState<LatLngTuple | null>(null);
  const [isShiftPressed, setIsShiftPressed] = useState(false);
  const [isHoveringStartPoint, setIsHoveringStartPoint] = useState(false);

  useEffect(() => {
    const area = calculatePolygonArea(points, map);
    onAreaChange(area);
  }, [points, map, onAreaChange]);

  useEffect(() => {
    map.getContainer().style.cursor = 'crosshair';
    return () => {
      map.getContainer().style.cursor = '';
    };
  }, [map]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Shift') setIsShiftPressed(true);
    if (e.key === 'Escape') onPointsChange([]);
  }, [onPointsChange]);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Shift') setIsShiftPressed(false);
  }, []);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  map.on('mousemove', (e) => {
    setMousePos([e.latlng.lat, e.latlng.lng]);
  });

  map.on('click', (e) => {
    if (isHoveringStartPoint) return;

    let newPoint: LatLngTuple = [e.latlng.lat, e.latlng.lng];
    if (isShiftPressed && points.length > 0) {
      newPoint = getSnappedPoint(points[points.length - 1], newPoint, map);
    }
    onPointsChange([...points, newPoint]);
  });

  const canCloseShape = points.length > 2;
  const isClosing = canCloseShape && isHoveringStartPoint;

  const primaryColor = '#f97316'; // orange
  const closingColor = '#22c55e'; // green
  const currentColor = isClosing ? closingColor : primaryColor;

  const ghostLinePoints: LatLngTuple[] = [];
  if (points.length > 0 && mousePos) {
    const lastPoint = points[points.length - 1];
    const dynamicPoint = isClosing ? points[0] : (isShiftPressed ? getSnappedPoint(lastPoint, mousePos, map) : mousePos);
    ghostLinePoints.push(lastPoint, dynamicPoint);
  }

  const renderMarkerForSegment = (p1: LatLngTuple, p2: LatLngTuple, polygonPoints: LatLngTuple[]) => {
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
    return <Marker key={`${p1.toString()}-${p2.toString()}`} position={finalPosition} icon={icon} />;
  };

  return (
    <>
      {points.length > 0 && (
        <Polygon positions={points} pathOptions={{ color: currentColor, weight: 3, fillOpacity: 0.1 }} />
      )}
      {ghostLinePoints.length > 0 && (
        <Polyline positions={ghostLinePoints} pathOptions={{ color: currentColor, weight: 3, dashArray: '5, 10' }} />
      )}
      {points.map((point, index) => (
        <CircleMarker 
          key={index} 
          center={point} 
          radius={5} 
          pathOptions={{ 
            color: 'white', 
            fillColor: isClosing && index === 0 ? closingColor : primaryColor, 
            fillOpacity: 1, 
            weight: 2 
          }}
          eventHandlers={ index === 0 && canCloseShape ? {
            mouseover: () => setIsHoveringStartPoint(true),
            mouseout: () => setIsHoveringStartPoint(false),
            click: onShapeComplete,
          } : {}}
        />
      ))}
      {points.slice(0, -1).map((p, i) => renderMarkerForSegment(p, points[i+1], points))}
      {ghostLinePoints.length === 2 && renderMarkerForSegment(ghostLinePoints[0], ghostLinePoints[1], points)}
    </>
  );
};

export default MapDrawingLayer;