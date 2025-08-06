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
      
      // Create proper 3D extruded building
      if (surfaceHeight > 0) {
        // Create the extruded building polygon
        const extrudedBuilding = new maptalks.Polygon([segmentCoords], {
          id: `${segment.id}-building`,
          symbol: {
            lineColor: '#8b4513',
            lineWidth: 2,
            polygonFill: '#d2b48c',
            polygonOpacity: 0.8,
            // 3D extrusion properties
            extrudeHeight: surfaceHeight,
            extrudeFill: '#daa520',
            extrudeOpacity: 0.9,
            extrudeLineColor: '#8b4513',
            extrudeLineWidth: 1,
          },
        });
        
        // Enable 3D extrusion
        extrudedBuilding.config('enableAltitude', true);
        extrudedBuilding.setAltitude(0, surfaceHeight);
        extrudedBuilding.on('click', () => onSelectSegment(segment));
        geometries.push(extrudedBuilding);
        
        // Create rooftop surface at the building height
        const rooftop = new maptalks.Polygon([segmentCoords], {
          id: `${segment.id}-rooftop`,
          symbol: {
            lineColor: '#fbbf24',
            lineWidth: 2,
            polygonFill: '#fef3c7',
            polygonOpacity: 0.7,
          },
        });
        
        // Position rooftop at building height
        rooftop.config('enableAltitude', true);
        rooftop.setAltitude(surfaceHeight);
        rooftop.on('click', () => onSelectSegment(segment));
        geometries.push(rooftop);
        
        // Add height labels at multiple positions
        const bounds = new maptalks.Polygon([segmentCoords]).getExtent();
        const corners = [
          [bounds.xmin, bounds.ymin],
          [bounds.xmax, bounds.ymin],
          [bounds.xmax, bounds.ymax],
          [bounds.xmin, bounds.ymax]
        ];
        
        corners.forEach((corner, index) => {
          if (index % 2 === 0) { // Show on alternate corners to avoid clutter
            const heightLabel = new maptalks.Marker(corner, {
              id: `${segment.id}-height-label-${index}`,
              symbol: {
                textName: `${segment.surfaceHeight?.toFixed(1) || 0} ft`,
                textSize: 10,
                textFill: '#000',
                textHaloFill: '#fff',
                textHaloRadius: 2,
                textDy: -5,
              },
            });
            heightLabel.config('enableAltitude', true);
            heightLabel.setAltitude(surfaceHeight + 2); // Slightly above rooftop
            geometries.push(heightLabel);
          }
        });
      } else {
        // Ground level polygon for segments without height
        const groundPolygon = new maptalks.Polygon([segmentCoords], {
          id: segment.id,
          symbol: {
            lineColor: '#ca8a04',
            lineWidth: 2,
            polygonFill: '#f97316',
            polygonOpacity: segment.id === selectedSegment?.id ? 0.4 : 0.2,
          },
        });
        groundPolygon.on('click', () => onSelectSegment(segment));
        geometries.push(groundPolygon);
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
          });
          
          // Position modules on the rooftop surface
          if (surfaceHeight > 0) {
            modulePolygon.config('enableAltitude', true);
            modulePolygon.setAltitude(surfaceHeight + 0.1); // Slightly above rooftop
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