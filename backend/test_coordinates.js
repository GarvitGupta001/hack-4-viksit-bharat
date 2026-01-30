// Simple test to validate coordinate formatting logic
console.log("Testing coordinate formatting logic...");

// Simulate the coordinate processing logic from satellite.service.js
function formatCoordinates(coordinates) {
    if (!Array.isArray(coordinates) || coordinates.length === 0) {
        throw new Error("Invalid coordinates: must be a non-empty array of coordinate pairs");
    }

    return coordinates.map(coord => {
        // If coord is already an array with 2 elements, determine if it's [lng, lat] or [lat, lng] format
        if (Array.isArray(coord) && coord.length === 2) {
            const first = Number(coord[0]);
            const second = Number(coord[1]);

            // Determine if it's [lng, lat] or [lat, lng] format based on value ranges
            const firstIsLng = Math.abs(first) > 90; // If first value is outside latitude range, it's likely longitude
            const secondIsLatForTest = Math.abs(second) <= 90; // If second value is within latitude range

            if (firstIsLng && secondIsLatForTest) {
                // This is [lng, lat] format - use as is
                return [first, second]; // [longitude, latitude] for Shapely
            }
            // If first is within latitude range and second is outside latitude range, it's [lat, lng] format
            else if (Math.abs(first) <= 90 && Math.abs(second) > 90) {
                // This is [lat, lng] format - swap to [lng, lat]
                return [second, first]; // [longitude, latitude] for Shapely
            }
            // Special case: both values are within latitude range (both <= 90)
            // Use the fact that longitude values are typically larger in magnitude in many regions
            else if (Math.abs(first) <= 90 && Math.abs(second) <= 90) {
                // If first is smaller than second, it's more likely to be latitude (typically smaller values)
                if (Math.abs(first) < Math.abs(second)) {
                    // Likely [lat, lng] - swap to [lng, lat]
                    return [second, first]; // [longitude, latitude] for Shapely
                } else {
                    // Likely [lng, lat] - use as is
                    return [first, second]; // [longitude, latitude] for Shapely
                }
            }
            else {
                // If we can't determine the format clearly, throw an error
                throw new Error(`Ambiguous coordinate values: [${first}, ${second}]. Unable to determine if format is [lat, lng] or [lng, lat].`);
            }
        }

        // If coord is an object with lat/lng properties, convert to [lng, lat] array (for Shapely Polygon)
        if (typeof coord === 'object' && coord !== null && coord.lat !== undefined && coord.lng !== undefined) {
            const lng = Number(coord.lng);
            const lat = Number(coord.lat);

            // Basic validation to ensure values are in reasonable ranges
            if (Math.abs(lat) > 90 || Math.abs(lng) > 180) {
                throw new Error(`Invalid coordinate values: [${lng}, ${lat}]. Latitude must be between -90 and 90, longitude between -180 and 180.`);
            }

            return [lng, lat]; // [longitude, latitude] for Shapely
        }

        // If coord is an object with lat/lon properties (alternative format), convert to [lon, lat]
        if (typeof coord === 'object' && coord !== null && coord.lat !== undefined && coord.lon !== undefined) {
            const lon = Number(coord.lon);
            const lat = Number(coord.lat);

            // Basic validation to ensure values are in reasonable ranges
            if (Math.abs(lat) > 90 || Math.abs(lon) > 180) {
                throw new Error(`Invalid coordinate values: [${lon}, ${lat}]. Latitude must be between -90 and 90, longitude between -180 and 180.`);
            }

            return [lon, lat]; // [longitude, latitude] for Shapely
        }

        throw new Error(`Invalid coordinate format: ${JSON.stringify(coord)}. Expected [lng, lat] array, {lat, lng} object, or {lat, lon} object.`);
    });
}

// Test cases
console.log("\n1. Testing coordinates from property service (already in [lng, lat] format):");
const coordsFromPropertyService = [
    [72.9289, 22.5645], // [lng, lat]
    [72.9295, 22.5648],
    [72.9290, 22.5650]
];
console.log("Input:", coordsFromPropertyService);
console.log("Output:", formatCoordinates(coordsFromPropertyService));

console.log("\n2. Testing coordinates in {lat, lng} object format:");
const coordsAsObjects = [
    { lat: 22.5645, lng: 72.9289 },
    { lat: 22.5648, lng: 72.9295 },
    { lat: 22.5650, lng: 72.9290 }
];
console.log("Input:", coordsAsObjects);
console.log("Output:", formatCoordinates(coordsAsObjects));

console.log("\n3. Testing coordinates in [lat, lng] array format (incorrect order):");
const coordsAsLatLonArrays = [
    [22.5645, 72.9289], // [lat, lng] - wrong order
    [22.5648, 72.9295],
    [22.5650, 72.9290]
];
console.log("Input:", coordsAsLatLonArrays);
try {
    console.log("Output:", formatCoordinates(coordsAsLatLonArrays));
} catch (e) {
    console.log("Error (expected):", e.message);
}

console.log("\n4. Testing invalid coordinates (out of range):");
const invalidCoords = [
    [72.9289, 122.5645] // latitude > 90
];
console.log("Input:", invalidCoords);
try {
    console.log("Output:", formatCoordinates(invalidCoords));
} catch (e) {
    console.log("Error (expected):", e.message);
}

console.log("\nAll tests completed!");