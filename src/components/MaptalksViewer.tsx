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
        // Create the main extruded building with all sides colored
        const extrudedBuilding = new maptalks.Polygon([segmentCoords], {
          id: `${segment.id}-building`,
          symbol: {
            // Building outline
            lineColor: '#654321',
            lineWidth: 2,
            // Top surface (rooftop)
            polygonFill: '#daa520',
            polygonOpacity: 0.9,
            // 3D extrusion properties for all sides
            extrudeHeight: surfaceHeight,
            // Building walls - main color
            extrudeFill: '#cd853f',
            extrudeOpacity: 0.9,
            extrudeLineColor: '#654321',
            extrudeLineWidth: 2,
            // Shadow and lighting effects
            extrudeShadow: true,
            extrudeShadowColor: 'rgba(0,0,0,0.4)',
            extrudeShadowBlur: 10,
            // Side face colors for realistic appearance
            extrudeFaces: [
              { fill: '#d2b48c', opacity: 0.8 }, // North face (lighter)
              { fill: '#bc9a6a', opacity: 0.9 }, // East face (medium)
              { fill: '#a0845c', opacity: 0.95 }, // South face (darker)
              { fill: '#8b7355', opacity: 0.9 }  // West face (medium-dark)
            ]
          },
        });
        
        // Enable 3D extrusion
        extrudedBuilding.config('enableAltitude', true);
        extrudedBuilding.setAltitude(0);
        extrudedBuilding.on('click', () => onSelectSegment(segment));
        geometries.push(extrudedBuilding);
        
        // Add shadow polygon on ground
        const shadowOffset = surfaceHeight * 0.5; // Shadow length based on height
        const shadowCoords = segmentCoords.map(coord => [
          coord[0] + shadowOffset * 0.0001, // Offset shadow eastward
          coord[1] - shadowOffset * 0.0001  // Offset shadow southward
        ]);
        
        const buildingShadow = new maptalks.Polygon([shadowCoords], {
          id: `${segment.id}-shadow`,
          symbol: {
            lineColor: 'transparent',
            lineWidth: 0,
            polygonFill: '#000000',
            polygonOpacity: 0.3,
          },
        });
        buildingShadow.config('enableAltitude', true);
        buildingShadow.setAltitude(0.1); // Slightly above ground
        geometries.push(buildingShadow);
        
        // Create elevated rooftop surface for solar panels
        const rooftop = new maptalks.Polygon([segmentCoords], {
          id: `${segment.id}-rooftop`,
          symbol: {
            lineColor: '#f59e0b',
            lineWidth: 1,
            polygonFill: '#fbbf24',
            polygonOpacity: 0.8,
          },
        });
        
        // Position rooftop at building height
        rooftop.config('enableAltitude', true);
        rooftop.setAltitude(surfaceHeight);
        rooftop.on('click', () => onSelectSegment(segment));
        geometries.push(rooftop);
        
        // Add racking structure if racking height is specified
        if (rackingHeight > 0) {
          const rackingStructure = new maptalks.Polygon([segmentCoords], {
            id: `${segment.id}-racking`,
            symbol: {
              lineColor: '#6b7280',
              lineWidth: 1,
              polygonFill: 'transparent',
              polygonOpacity: 0,
              // Racking frame visualization
              extrudeHeight: rackingHeight,
              extrudeFill: '#9ca3af',
              extrudeOpacity: 0.6,
              extrudeLineColor: '#6b7280',
              extrudeLineWidth: 1,
            },
          });
          rackingStructure.config('enableAltitude', true);
          rackingStructure.setAltitude(surfaceHeight);
          geometries.push(rackingStructure);
        }
        
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
            const displayHeight = rackingHeight > 0 
              ? `${((surfaceHeight + rackingHeight) / 0.3048).toFixed(1)} ft` 
              : `${(surfaceHeight / 0.3048).toFixed(1)} ft`;
              
            const heightLabel = new maptalks.Marker(corner, {
              id: `${segment.id}-height-label-${index}`,
              symbol: {
                textName: displayHeight,
                textSize: 12,
                textFill: '#ffffff',
                textHaloFill: '#fff',
                textHaloRadius: 3,
                textDy: -8,
                textWeight: 'bold',
                // Add background box for better visibility
                markerType: 'ellipse',
                markerFill: 'rgba(0,0,0,0.7)',
                markerWidth: 60,
                markerHeight: 20,
              },
            });
            heightLabel.config('enableAltitude', true);
            heightLabel.setAltitude(totalHeight + 3); // Above everything
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