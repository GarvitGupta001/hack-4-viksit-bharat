/**
 * Calculate the area of a polygon using the shoelace formula
 * @param {Array} coordinates - Array of [lng, lat] coordinates forming a polygon
 * @returns {number} Area in arbitrary units (proportional to degrees squared)
 */
function calculatePolygonArea(coordinates) {
    try {
        if (coordinates.length < 3) {
            return 0;
        }

        // Convert coordinates to a consistent format
        const points = coordinates.map(coord => {
            if (Array.isArray(coord)) {
                return { x: coord[0], y: coord[1] }; // [lng, lat]
            } else {
                return { x: coord.lng, y: coord.lat }; // {lng, lat}
            }
        });

        let area = 0;
        const n = points.length;

        for (let i = 0; i < n; i++) {
            const j = (i + 1) % n;
            area += points[i].x * points[j].y;
            area -= points[j].x * points[i].y;
        }

        return Math.abs(area) / 2;
    } catch (error) {
        console.error('Error calculating polygon area:', error);
        return 0;
    }
}

/**
 * Check if a point is inside a polygon using ray casting algorithm
 * @param {Object} point - Point {x, y} to check
 * @param {Array} polygon - Array of points {x, y} forming the polygon
 * @returns {boolean} True if point is inside the polygon
 */
function isPointInPolygon(point, polygon) {
    let inside = false;
    const x = point.x;
    const y = point.y;

    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i].x;
        const yi = polygon[i].y;
        const xj = polygon[j].x;
        const yj = polygon[j].y;

        const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }

    return inside;
}

/**
 * Calculate the approximate overlap area between two polygons using sampling
 * @param {Array} poly1Coords - First polygon coordinates
 * @param {Array} poly2Coords - Second polygon coordinates
 * @returns {number} Approximate overlap area ratio
 */
function calculateApproximateOverlap(poly1Coords, poly2Coords) {
    // Convert coordinates to consistent format
    const poly1 = poly1Coords.map(coord => {
        if (Array.isArray(coord)) {
            return { x: coord[0], y: coord[1] };
        } else {
            return { x: coord.lng, y: coord.lat };
        }
    });

    const poly2 = poly2Coords.map(coord => {
        if (Array.isArray(coord)) {
            return { x: coord[0], y: coord[1] };
        } else {
            return { x: coord.lng, y: coord.lat };
        }
    });

    // Find bounding box for both polygons
    const allX = [...poly1, ...poly2].map(p => p.x);
    const allY = [...poly1, ...poly2].map(p => p.y);

    const minX = Math.min(...allX);
    const maxX = Math.max(...allX);
    const minY = Math.min(...allY);
    const maxY = Math.max(...allY);

    // Sample points in the bounding box to estimate overlap
    const sampleSize = 1000;
    let overlapCount = 0;

    for (let i = 0; i < sampleSize; i++) {
        const x = minX + (Math.random() * (maxX - minX));
        const y = minY + (Math.random() * (maxY - minY));

        const point = { x, y };

        const inPoly1 = isPointInPolygon(point, poly1);
        const inPoly2 = isPointInPolygon(point, poly2);

        if (inPoly1 && inPoly2) {
            overlapCount++;
        }
    }

    return overlapCount / sampleSize;
}

/**
 * Check if two polygons overlap beyond a certain threshold
 * @param {Array} poly1Coords - First polygon coordinates [[lng, lat], ...]
 * @param {Array} poly2Coords - Second polygon coordinates [[lng, lat], ...]
 * @param {number} threshold - Threshold percentage (0.10 for 10%)
 * @returns {Object} Result object with overlap info
 */
function checkPolygonOverlap(poly1Coords, poly2Coords, threshold = 0.10) {
    try {
        if (!poly1Coords || !poly2Coords || poly1Coords.length < 3 || poly2Coords.length < 3) {
            return {
                hasOverlap: false,
                overlapArea: 0,
                overlapPercentage: 0,
                area1: 0,
                area2: 0
            };
        }

        const area1 = calculatePolygonArea(poly1Coords);
        const area2 = calculatePolygonArea(poly2Coords);

        // Estimate overlap using sampling
        const overlapRatio = calculateApproximateOverlap(poly1Coords, poly2Coords);
        const estimatedOverlapArea = overlapRatio * Math.min(area1, area2);

        // Calculate overlap percentage relative to the smaller polygon
        const minArea = Math.min(area1, area2);
        const overlapPercentage = minArea > 0 ? estimatedOverlapArea / minArea : 0;

        return {
            hasOverlap: overlapPercentage > threshold,
            overlapArea: estimatedOverlapArea,
            overlapPercentage,
            area1,
            area2,
            maxAllowedOverlap: minArea * threshold
        };
    } catch (error) {
        console.error('Error checking polygon overlap:', error);
        return {
            hasOverlap: false,
            overlapArea: 0,
            overlapPercentage: 0,
            area1: 0,
            area2: 0
        };
    }
}

/**
 * Check if a new property overlaps with any existing properties beyond the threshold
 * @param {Array} newBoundaryCoordinates - New property coordinates [[lng, lat], ...]
 * @param {string} newPropertyId - ID of the new property (to exclude from check)
 * @param {Object} propertyModel - Mongoose Property model
 * @param {number} threshold - Overlap threshold (default 0.10 for 10%)
 * @returns {Promise<Object>} Result object with overlap info
 */
async function checkPropertyOverlap(newBoundaryCoordinates, newPropertyId, propertyModel, threshold = 0.10) {
    try {
        if (!newBoundaryCoordinates || newBoundaryCoordinates.length === 0) {
            return {
                hasConflict: false
            };
        }

        // Find all existing properties (excluding the current one if updating)
        const query = newPropertyId ? { _id: { $ne: newPropertyId } } : {};
        const existingProperties = await propertyModel.find(query).select('boundaryCoordinates title address');

        for (const existingProperty of existingProperties) {
            if (!existingProperty.boundaryCoordinates || existingProperty.boundaryCoordinates.length === 0) {
                continue; // Skip properties without coordinates
            }

            const overlapResult = checkPolygonOverlap(newBoundaryCoordinates, existingProperty.boundaryCoordinates, threshold);

            if (overlapResult.hasOverlap) {
                return {
                    hasConflict: true,
                    conflictingProperty: {
                        id: existingProperty._id.toString(),
                        title: existingProperty.title,
                        address: existingProperty.address
                    },
                    overlapDetails: overlapResult
                };
            }
        }

        return {
            hasConflict: false
        };
    } catch (error) {
        console.error('Error checking property overlap:', error);
        throw error;
    }
}

module.exports = {
    checkPolygonOverlap,
    checkPropertyOverlap,
    calculatePolygonArea
};