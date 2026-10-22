// Small geodesic helpers used by the radius selection tool.
// Distances are in meters, positions are [longitude, latitude] in degrees.

// Mean Earth radius in meters (same value turf.js uses)
const EARTH_RADIUS_M = 6371008.8;

// Number of vertices used to approximate a circle
export const CIRCLE_STEPS = 64;

function toRad(deg: number): number {
    return deg * Math.PI / 180;
}

function toDeg(rad: number): number {
    return rad * 180 / Math.PI;
}

/** Great-circle distance in meters between two positions (haversine formula). */
export function distanceMeters(a: number[], b: number[]): number {
    const dLat = toRad(b[1] - a[1]);
    const dLng = toRad(b[0] - a[0]);
    const h = Math.pow(Math.sin(dLat / 2), 2) +
        Math.cos(toRad(a[1])) * Math.cos(toRad(b[1])) * Math.pow(Math.sin(dLng / 2), 2);
    return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Position reached from `center` after travelling `meters` along `bearingRad` (clockwise from north). */
export function destination(center: number[], bearingRad: number, meters: number): number[] {
    const delta = meters / EARTH_RADIUS_M;
    const lat1 = toRad(center[1]);
    const lng1 = toRad(center[0]);
    const lat2 = Math.asin(
        Math.sin(lat1) * Math.cos(delta) +
        Math.cos(lat1) * Math.sin(delta) * Math.cos(bearingRad)
    );
    const lng2 = lng1 + Math.atan2(
        Math.sin(bearingRad) * Math.sin(delta) * Math.cos(lat1),
        Math.cos(delta) - Math.sin(lat1) * Math.sin(lat2)
    );
    // Longitude is intentionally not wrapped to [-180, 180]: that keeps the ring continuous
    // when a circle crosses the antimeridian.
    return [toDeg(lng2), toDeg(lat2)];
}

/**
 * Closed GeoJSON ring (counter-clockwise) approximating a circle of `meters` around `center`.
 * The first and the last position are equal, as GeoJSON requires.
 */
export function circleRing(center: number[], meters: number, steps: number = CIRCLE_STEPS): number[][] {
    const ring: number[][] = [];
    for (let i = 0; i < steps; i++) {
        ring.push(destination(center, -(2 * Math.PI * i) / steps, meters));
    }
    ring.push(ring[0].slice());
    return ring;
}

/** Radius text for the live label, always in meters. */
export function formatMeters(meters: number): string {
    return Math.round(meters).toLocaleString() + ' m';
}
