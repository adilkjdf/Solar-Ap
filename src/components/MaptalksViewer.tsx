import React, { useEffect, useRef } from 'react';
import * as maptalks from 'maptalks';
import 'maptalks/dist/maptalks.css';
import { ProjectData, FieldSegment } from '../types/project';

interface MaptalksViewerProps {
  project: ProjectData;
  fieldSegments: FieldSegment[];
  selectedSegment: FieldSegment | null;
  onSelectSegment: (segment: FieldSegment | null) => void;
}

const MaptalksViewer: React.FC<MaptalksViewerProps> = ({
  project,
  fieldSegments,
  selectedSegment,
  onSelectSegment,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maptalks.Map | null>(null);
  const vectorLayerRef = useRef<maptalks.VectorLayer | null>(null);

  useEffect(() => {
    if (mapRef.current || !mapContainerRef.current) return;

    const center = project.coordinates
      ? [project.coordinates.lng, project.coordinates.lat]
      : [-122.4194, 37.7749];

    const map = new maptalks.Map(mapContainerRef.current, {
      center: center,
      zoom: 19,
      pitch: 45, // 3D view
      bearing: 0,
      baseLayer: new maptalks.TileLayer('base', {
        urlTemplate: 'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
        attribution: '&copy; Google Maps',
      }),
    });

    const layer = new maptalks.VectorLayer('vector').addTo(map);
    vectorLayerRef.current = layer;
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [project.coordinates]);

  useEffect(() => {
    const layer = vectorLayerRef.current;
    if (!layer) return;

    layer.clear();

    const geometries: maptalks.Geometry[] = [];

    fieldSegments.forEach(segment => {
      const segmentCoords = segment.points.map(p => [p[1], p[0]]);
      const surfaceHeight = (segment.surfaceHeight || 0) * 0.3048; // Convert feet to meters
      
      // Create 3D building base
      if (surfaceHeight > 0) {
        const buildingBase = new maptalks.Polygon([segmentCoords], {
          id: `${segment.id}-base`,
          symbol: {
            lineColor: '#8b4513',
            lineWidth: 2,
            polygonFill: '#d2691e',
            polygonOpacity: 0.6,
          },
        });
        geometries.push(buildingBase);
        
        // Create extruded building
        const building = new maptalks.Polygon([segmentCoords], {
          id: `${segment.id}-building`,
          symbol: {
            lineColor: '#fbbf24',
            lineWidth: 3,
            polygonFill: '#fef3c7',
            polygonOpacity: 0.8,
          },
          properties: {
            height: surfaceHeight,
          },
        });
        
        // Set the height for 3D extrusion
        building.setProperties({ height: surfaceHeight });
        building.on('click', () => onSelectSegment(segment));
        geometries.push(building);
        
        // Add height labels
        const center = building.getCenter();
        const heightLabel = new maptalks.Marker(center, {
          id: `${segment.id}-height-label`,
          symbol: {
            textName: `${segment.surfaceHeight?.toFixed(1) || 0} ft`,
            textSize: 12,
            textFill: '#000',
            textHaloFill: '#fff',
            textHaloRadius: 2,
            textDy: -10,
          },
        });
        geometries.push(heightLabel);
      } else {
        // Ground level polygon
        const polygon = new maptalks.Polygon([segmentCoords], {
          id: segment.id,
          symbol: {
            lineColor: '#ca8a04',
            lineWidth: 2,
            polygonFill: '#f97316',
            polygonOpacity: segment.id === selectedSegment?.id ? 0.4 : 0.2,
          },
        });
        polygon.on('click', () => onSelectSegment(segment));
        geometries.push(polygon);
      }

      // Add solar modules on the rooftop
      if (segment.moduleLayout) {
        segment.moduleLayout.forEach((modulePolygonPoints, i) => {
          const moduleCoords = modulePolygonPoints.map(p => [p[1], p[0]]);
          const modulePolygon = new maptalks.Polygon([moduleCoords], {
            id: `${segment.id}-module-${i}`,
            symbol: {
              lineColor: 'white',
              lineWidth: 1,
              polygonFill: '#3b82f6',
              polygonOpacity: 0.8,
            },
            properties: {
              height: surfaceHeight + 0.1, // Slightly above the building surface
            },
          });
          
          // Set module height for 3D visualization
          if (surfaceHeight > 0) {
            modulePolygon.setProperties({ height: surfaceHeight + 0.1 });
          }
          
          geometries.push(modulePolygon);
        });
      }
    });

    layer.addGeometry(geometries);
  }, [fieldSegments, selectedSegment, onSelectSegment]);

  return <div ref={mapContainerRef} className="h-full w-full" />;
};

export default MaptalksViewer;