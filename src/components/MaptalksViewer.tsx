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
          geometries.push(modulePolygon);
        });
      }
    });

    layer.addGeometry(geometries);
  }, [fieldSegments, selectedSegment, onSelectSegment]);

  return <div ref={mapContainerRef} className="h-full w-full" />;
};

export default MaptalksViewer;