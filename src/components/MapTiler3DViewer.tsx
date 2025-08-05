import React, { useMemo, useRef, useEffect, useState } from 'react';
import Map, { Source, Layer, MapLayerMouseEvent, MapRef } from 'react-map-gl/maplibre';
import maplibregl from 'maplibre-gl';
import { FeatureCollection } from 'geojson';
import { ProjectData, FieldSegment } from '../types/project';
import { getMidpoint } from '../utils/geometry';

const MAPTILER_API_KEY = 'aTChQEvBqKVcP0AXd2bH';
const FEET_TO_METERS = 0.3048;

interface MapTiler3DViewerProps {
  project: ProjectData;
  fieldSegments: FieldSegment[];
  selectedSegment: FieldSegment | null;
  onSelectSegment: (segment: FieldSegment | null) => void;
}

const MapTiler3DViewer: React.FC<MapTiler3DViewerProps> = ({ project, fieldSegments, selectedSegment, onSelectSegment }) => {
  const mapRef = useRef<MapRef>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [labelGeoJSON, setLabelGeoJSON] = useState<FeatureCollection>({ type: 'FeatureCollection', features: [] });

  const mapCenter = project.coordinates 
    ? { longitude: project.coordinates.lng, latitude: project.coordinates.lat }
    : { longitude: -122.4194, latitude: 37.7749 };

  const initialViewState = {
    ...mapCenter,
    zoom: 18,
    pitch: 60,
    bearing: 0,
  };

  const segmentsGeoJSON: FeatureCollection = useMemo(() => ({
    type: 'FeatureCollection',
    features: fieldSegments.map(segment => {
      const baseHeightMeters = 0; // Extrude from the ground
      const totalHeightMeters = (segment.surfaceHeight || 0) * FEET_TO_METERS;
      return {
        type: 'Feature',
        id: segment.id,
        geometry: {
          type: 'Polygon',
          coordinates: [
            segment.points.length > 0
              ? [...segment.points.map(p => [p[1], p[0]]), [segment.points[0][1], segment.points[0][0]]]
              : []
          ],
        },
        properties: { 
          id: segment.id,
          baseHeight: baseHeightMeters,
          totalHeight: totalHeightMeters,
        },
      };
    }),
  }), [fieldSegments]);

  const modulesGeoJSON: FeatureCollection = useMemo(() => ({
    type: 'FeatureCollection',
    features: fieldSegments.flatMap(segment => {
      const baseHeightMeters = (segment.surfaceHeight || 0) * FEET_TO_METERS;
      const rackingHeightMeters = (segment.rackingHeight || 0) * FEET_TO_METERS;
      const modulePanelThicknessMeters = 0.05;
      const totalHeightMeters = baseHeightMeters + rackingHeightMeters + modulePanelThicknessMeters;

      return (segment.moduleLayout || []).map((modulePolygon, index) => ({
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [
            modulePolygon.length > 0
              ? [...modulePolygon.map(p => [p[1], p[0]]), [modulePolygon[0][1], modulePolygon[0][0]]]
              : []
          ],
        },
        properties: { 
          id: `${segment.id}-module-${index}`,
          baseHeight: baseHeightMeters,
          totalHeight: totalHeightMeters
        },
      }));
    }),
  }), [fieldSegments]);

  useEffect(() => {
    const map = mapRef.current?.getMap();
    if (!map || !map.isStyleLoaded()) return;

    fieldSegments.forEach(segment => {
      map.setFeatureState(
        { source: 'field-segments', id: segment.id },
        { selected: segment.id === selectedSegment?.id }
      );
    });
  }, [selectedSegment, fieldSegments]);

  useEffect(() => {
    if (!mapLoaded) return;
    const map = mapRef.current?.getMap();
    if (!map) return;

    const features = fieldSegments.flatMap(segment => {
      const segmentPoints = segment.points;
      if (segmentPoints.length < 2) return [];
      const closedPoints = [...segmentPoints, segmentPoints[0]];

      return closedPoints.slice(0, -1).map((p1, i) => {
        const p2 = closedPoints[i + 1];
        
        const lngLat1 = new maplibregl.LngLat(p1[1], p1[0]);
        const lngLat2 = new maplibregl.LngLat(p2[1], p2[0]);
        const distanceInMeters = lngLat1.distanceTo(lngLat2);
        const distanceInFeet = distanceInMeters * 3.28084;

        const midpoint = getMidpoint(p1, p2);

        const p1_container = map.project(lngLat1);
        const p2_container = map.project(lngLat2);
        const angleRad = Math.atan2(p2_container.y - p1_container.y, p2_container.x - p1_container.x);
        let angleDeg = angleRad * (180 / Math.PI);
        
        if (angleDeg < -90 || angleDeg > 90) {
            angleDeg += 180;
        }

        return {
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [midpoint[1], midpoint[0]] },
            properties: { text: `${distanceInFeet.toFixed(1)} ft`, rotation: angleDeg }
        };
      });
    }).flat().filter(Boolean);

    setLabelGeoJSON({ type: 'FeatureCollection', features: features as any });
  }, [fieldSegments, mapLoaded]);

  const mapStyle = `https://api.maptiler.com/maps/satellite/style.json?key=${MAPTILER_API_KEY}`;

  const handleMapClick = (e: MapLayerMouseEvent) => {
    const clickedSegmentFeature = e.features?.find(f => f.layer.id === 'segment-fills');
    if (clickedSegmentFeature) {
      const segmentId = clickedSegmentFeature.properties?.id;
      const segment = fieldSegments.find(s => s.id === segmentId);
      onSelectSegment(segment || null);
    } else {
      onSelectSegment(null);
    }
  };

  return (
    <Map
      ref={mapRef}
      mapLib={maplibregl}
      initialViewState={initialViewState}
      style={{ width: '100%', height: '100%' }}
      mapStyle={mapStyle}
      onClick={handleMapClick}
      interactiveLayerIds={['segment-fills']}
      terrain={{ source: 'maptiler-terrain', exaggeration: 1.5 }}
      onLoad={() => setMapLoaded(true)}
    >
      <Source id="maptiler-terrain" type="raster-dem" url={`https://api.maptiler.com/tiles/terrain-rgb-v2/tiles.json?key=${MAPTILER_API_KEY}`} tileSize={512} />
      
      <Source id="field-segments" type="geojson" data={segmentsGeoJSON} promoteId="id">
        <Layer
          id="segment-outlines"
          type="line"
          paint={{ 'line-color': '#ca8a04', 'line-width': 2 }}
        />
        <Layer
          id="segment-fills"
          type="fill-extrusion"
          paint={{
            'fill-extrusion-color': ['case', ['boolean', ['feature-state', 'selected'], false], '#facc15', '#f97316'],
            'fill-extrusion-opacity': 0.6,
            'fill-extrusion-height': ['get', 'totalHeight'],
            'fill-extrusion-base': ['get', 'baseHeight'],
          }}
        />
      </Source>

      <Source id="segment-labels" type="geojson" data={labelGeoJSON}>
        <Layer
          id="labels-layer"
          type="symbol"
          layout={{
            'text-field': ['get', 'text'],
            'text-size': 12,
            'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
            'text-rotate': ['get', 'rotation'],
            'text-rotation-alignment': 'map',
            'text-pitch-alignment': 'viewport',
            'text-allow-overlap': true,
            'text-ignore-placement': true,
          }}
          paint={{
            'text-color': '#ffffff',
            'text-halo-color': '#000000',
            'text-halo-width': 1,
          }}
        />
      </Source>

      <Source id="modules" type="geojson" data={modulesGeoJSON}>
        <Layer
          id="module-fills"
          type="fill-extrusion"
          paint={{
            'fill-extrusion-color': '#3b82f6',
            'fill-extrusion-opacity': 0.9,
            'fill-extrusion-height': ['get', 'totalHeight'],
            'fill-extrusion-base': ['get', 'baseHeight'],
          }}
        />
      </Source>
    </Map>
  );
};

export default MapTiler3DViewer;