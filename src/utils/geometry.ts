import { Map, latLng, LatLngTuple, Point, bounds } from 'leaflet';
import { FieldSegment, Module } from '../types/project';

const FEET_PER_METER = 3.28084;

export const calculateDistanceInFeet = (p1: LatLngTuple, p2: LatLngTuple, map: Map): number => {
  const latLng1 = latLng(p1);
  const latLng2 = latLng(p2);
  const distanceInMeters = map.distance(latLng1, latLng2);
  return distanceInMeters * FEET_PER_METER;
};

export const getMidpoint = (p1: LatLngTuple, p2: LatLngTuple): LatLngTuple => {
  return [(p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2];
};

export const getSnappedPoint = (startPoint: LatLngTuple, endPoint: LatLngTuple, map: Map): LatLngTuple => {
  const startContainerPoint = map.latLngToContainerPoint(startPoint);
  const endContainerPoint = map.latLngToContainerPoint(endPoint);

  const dx = endContainerPoint.x - startContainerPoint.x;
  const dy = endContainerPoint.y - startContainerPoint.y;

  const angleRad = Math.atan2(dy, dx);
  const snappedAngleRad = Math.round(angleRad / (Math.PI / 4)) * (Math.PI / 4);

  const distance = Math.sqrt(dx * dx + dy * dy);

  const snappedContainerPoint = {
    x: startContainerPoint.x + distance * Math.cos(snappedAngleRad),
    y: startContainerPoint.y + distance * Math.sin(snappedAngleRad),
  };

  const snappedLatLng = map.containerPointToLatLng(new Point(snappedContainerPoint.x, snappedContainerPoint.y));
  return [snappedLatLng.lat, snappedLatLng.lng];
};

export const calculatePolygonAreaMeters = (points: LatLngTuple[], map: Map): number => {
  if (points.length < 3) return 0;
  const projectedPoints = points.map(p => map.project(latLng(p)));
  let area = 0;
  for (let i = 0; i < projectedPoints.length; i++) {
    const p1 = projectedPoints[i];
    const p2 = projectedPoints[(i + 1) % projectedPoints.length];
    area += p1.x * p2.y - p2.x * p1.y;
  }
  return Math.abs(area / 2);
};

export const calculatePolygonArea = (points: LatLngTuple[], map: Map): number => {
    const areaMeters = calculatePolygonAreaMeters(points, map);
    return areaMeters * FEET_PER_METER * FEET_PER_METER;
};

export const isPointInPolygon = (point: Point, polygon: Point[]): boolean => {
    let isInside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i].x, yi = polygon[i].y;
        const xj = polygon[j].x, yj = polygon[j].y;
        const intersect = ((yi > point.y) !== (yj > point.y))
            && (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);
        if (intersect) isInside = !isInside;
    }
    return isInside;
};

const pointToLineSegmentDistance = (p: Point, a: Point, b: Point): number => {
    const l2 = a.distanceTo(b) ** 2;
    if (l2 === 0) return p.distanceTo(a);
    let t = ((p.x - a.x) * (b.x - a.x) + (p.y - a.y) * (b.y - a.y)) / l2;
    t = Math.max(0, Math.min(1, t));
    const projection = new Point(a.x + t * (b.x - a.x), a.y + t * (b.y - a.y));
    return p.distanceTo(projection);
};

const getPixelsPerMeter = (map: Map): number => {
    const center = map.getCenter();
    const eastPoint = latLng(center.lat, center.lng + 0.0001);
    const distanceMeters = center.distanceTo(eastPoint);
    const centerPx = map.latLngToLayerPoint(center);
    const eastPx = map.latLngToLayerPoint(eastPoint);
    const distancePixels = centerPx.distanceTo(eastPx);
    return distancePixels / distanceMeters;
}

const lineIntersection = (p1: Point, p2: Point, p3: Point, p4: Point): Point | null => {
    const d = (p1.x - p2.x) * (p3.y - p4.y) - (p1.y - p2.y) * (p3.x - p4.x);
    if (Math.abs(d) < 1e-6) return null;

    const t = ((p1.x - p3.x) * (p3.y - p4.y) - (p1.y - p3.y) * (p3.x - p4.x)) / d;
    return new Point(p1.x + t * (p2.x - p1.x), p1.y + t * (p2.y - p1.y));
};

export const calculateInsetPolygon = (points: LatLngTuple[], setbackFeet: number, map: Map): LatLngTuple[] => {
    if (points.length < 3 || setbackFeet <= 0) return [];

    const pixelsPerMeter = getPixelsPerMeter(map);
    const setbackPx = setbackFeet / FEET_PER_METER * pixelsPerMeter;

    const containerPoints = points.map(p => map.latLngToContainerPoint(latLng(p)));

    const insetLines: {p1: Point, p2: Point}[] = [];

    for (let i = 0; i < containerPoints.length; i++) {
        const p1 = containerPoints[i];
        const p2 = containerPoints[(i + 1) % containerPoints.length];

        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const normalVec = new Point(-dy, dx);
        const dist = normalVec.distanceTo(new Point(0,0));
        const normal = dist > 0 ? normalVec.divideBy(dist) : new Point(0,0);

        const testPoint = p1.add(normal);
        if (!isPointInPolygon(testPoint, containerPoints)) {
            normal.x = -normal.x;
            normal.y = -normal.y;
        }

        const p1_inset = p1.add(normal.multiplyBy(setbackPx));
        const p2_inset = p2.add(normal.multiplyBy(setbackPx));
        insetLines.push({ p1: p1_inset, p2: p2_inset });
    }

    const insetPoints: Point[] = [];
    for (let i = 0; i < insetLines.length; i++) {
        const line1 = insetLines[i];
        const line2 = insetLines[(i + 1) % insetLines.length];
        const intersection = lineIntersection(line1.p1, line1.p2, line2.p1, line2.p2);
        if (intersection) {
            insetPoints.push(intersection);
        } else {
            // Fallback for parallel lines - this is a simplification
            insetPoints.push(line1.p2);
        }
    }

    return insetPoints.map(p => {
        const latLng = map.containerPointToLatLng(p);
        return [latLng.lat, latLng.lng];
    });
};


export const calculateAdvancedModuleLayout = (
  segment: FieldSegment,
  module: Module,
  map: Map
): { layout: LatLngTuple[][], count: number, nameplate: number, azimuth: number } => {
  const {
    points: polygon,
    orientation = 'Portrait',
    azimuth: segmentAzimuth,
    rowSpacing = 2,
    moduleSpacing = 0.1,
    setback = 4,
  } = segment;

  const { width: moduleWidthMeters, height: moduleHeightMeters, max_power_pmp: modulePower } = module;

  if (polygon.length < 3 || !moduleWidthMeters || !moduleHeightMeters || !modulePower) {
    return { layout: [], count: 0, nameplate: 0, azimuth: segment.azimuth };
  }

  const layerPolygon = polygon.map(p => map.latLngToLayerPoint(latLng(p)));

  let longestEdgeIndex = -1, maxDistSq = 0;
  for (let i = 0; i < layerPolygon.length; i++) {
    const p1 = layerPolygon[i];
    const p2 = layerPolygon[(i + 1) % layerPolygon.length];
    const distSq = p1.distanceTo(p2);
    if (distSq > maxDistSq) {
      maxDistSq = distSq;
      longestEdgeIndex = i;
    }
  }

  const p1 = layerPolygon[longestEdgeIndex];
  const p2 = layerPolygon[(longestEdgeIndex + 1) % layerPolygon.length];
  const defaultAngleRad = Math.atan2(p2.y - p1.y, p2.x - p1.x);
  const defaultAzimuth = (90 - defaultAngleRad * 180 / Math.PI + 360) % 360;
  
  const finalAzimuth = segmentAzimuth ?? defaultAzimuth;
  const angle = (90 - finalAzimuth) * (Math.PI / 180);

  const cos = Math.cos(-angle), sin = Math.sin(-angle);
  const origin = layerPolygon[0];
  const rotatedPolygon = layerPolygon.map(p => new Point(
    (p.x - origin.x) * cos - (p.y - origin.y) * sin,
    (p.x - origin.x) * sin + (p.y - origin.y) * cos
  ));

  const rotatedBounds = bounds(rotatedPolygon);
  
  const pixelsPerMeter = getPixelsPerMeter(map);

  const moduleWidth = orientation === 'Portrait' ? moduleWidthMeters : moduleHeightMeters;
  const moduleHeight = orientation === 'Portrait' ? moduleHeightMeters : moduleWidthMeters;

  const moduleWidthPx = moduleWidth * pixelsPerMeter;
  const moduleHeightPx = moduleHeight * pixelsPerMeter;
  const rowSpacingPx = (rowSpacing / FEET_PER_METER) * pixelsPerMeter;
  const moduleSpacingPx = (moduleSpacing / FEET_PER_METER) * pixelsPerMeter;
  const setbackPx = (setback / FEET_PER_METER) * pixelsPerMeter;

  const stepX = moduleWidthPx + moduleSpacingPx;
  const stepY = moduleHeightPx + rowSpacingPx;

  const moduleLayout: LatLngTuple[][] = [];
  let count = 0;

  const getIntersections = (y: number, poly: Point[]): number[] => {
    const intersections: number[] = [];
    for (let i = 0; i < poly.length; i++) {
        const p1 = poly[i];
        const p2 = poly[(i + 1) % poly.length];
        if (p1.y === p2.y) continue;
        if (Math.min(p1.y, p2.y) <= y && Math.max(p1.y, p2.y) > y) {
            const x = (y - p1.y) * (p2.x - p1.x) / (p2.y - p1.y) + p1.x;
            intersections.push(x);
        }
    }
    return intersections.sort((a, b) => a - b);
  };

  for (let y = rotatedBounds.min!.y; y < rotatedBounds.max!.y; y += stepY) {
    const y_bottom = y + moduleHeightPx;
    if (y_bottom > rotatedBounds.max!.y) continue;

    const top_intersections = getIntersections(y, rotatedPolygon);
    const bottom_intersections = getIntersections(y_bottom, rotatedPolygon);

    if (top_intersections.length < 2 || bottom_intersections.length < 2) {
        continue;
    }
    
    const start_x = Math.max(top_intersections[0], bottom_intersections[0]);
    const end_x = Math.min(top_intersections[top_intersections.length - 1], bottom_intersections[bottom_intersections.length - 1]);

    for (let x = start_x; x + moduleWidthPx <= end_x; x += stepX) {
        const moduleCorners = [
            new Point(x, y),
            new Point(x + moduleWidthPx, y),
            new Point(x + moduleWidthPx, y + moduleHeightPx),
            new Point(x, y + moduleHeightPx),
        ];

        let isModuleFullyValid = true;
        for (const corner of moduleCorners) {
            if (!isPointInPolygon(corner, rotatedPolygon)) {
                isModuleFullyValid = false;
                break;
            }
            let isCornerTooClose = false;
            for (let i = 0; i < rotatedPolygon.length; i++) {
                const p1 = rotatedPolygon[i];
                const p2 = rotatedPolygon[(i + 1) % rotatedPolygon.length];
                if (pointToLineSegmentDistance(corner, p1, p2) < setbackPx) {
                    isCornerTooClose = true;
                    break;
                }
            }
            if (isCornerTooClose) {
                isModuleFullyValid = false;
                break;
            }
        }

        if (isModuleFullyValid) {
            const cos_a = Math.cos(angle), sin_a = Math.sin(angle);
            const originalPoints = moduleCorners.map(p => {
                const rotatedX = p.x * cos_a - p.y * sin_a;
                const rotatedY = p.x * sin_a + p.y * cos_a;
                return new Point(rotatedX + origin.x, rotatedY + origin.y);
            });
            moduleLayout.push(originalPoints.map(p => {
                const latLng = map.layerPointToLatLng(p);
                return [latLng.lat, latLng.lng];
            }));
            count++;
        }
    }
  }

  const nameplate = (count * modulePower) / 1000;
  return { layout: moduleLayout, count, nameplate, azimuth: finalAzimuth };
};