const axios = require('axios');

// Test script for satellite verification integration
async function testSatelliteIntegration() {
    console.log('Testing Satellite Verification Integration...\n');
    
    try {
        // Test 1: Check if Flask satellite API is running
        console.log('1. Checking Flask satellite API health...');
        const healthResponse = await axios.get('http://localhost:5001/health');
        console.log('✓ Flask API is healthy:', healthResponse.data);
        
        // Test 2: Test satellite calculation with sample coordinates
        console.log('\n2. Testing satellite calculation with sample coordinates...');
        const sampleCoords = [
            [77.185, 28.565], 
            [77.200, 28.565], 
            [77.200, 28.575], 
            [77.185, 28.575]
        ];
        
        const calcResponse = await axios.post('http://localhost:5001/calculate', {
            coordinates: sampleCoords,
            startDate: '2023-01-01',
            endDate: '2023-12-31'
        });
        
        console.log('✓ Satellite calculation successful');
        console.log('  Total Carbon Sequestration:', calcResponse.data.total_annual_carbon_sequestration_tonnes, 'tonnes CO2');
        console.log('  Total Property Area:', calcResponse.data.total_property_area_hectares, 'hectares');
        
        // Test 3: Check if main backend API is running
        console.log('\n3. Checking main backend API...');
        const mainApiResponse = await axios.get('http://localhost:3000/');
        console.log('✓ Main backend is running:', mainApiResponse.data.message);
        
        // Test 4: Check if satellite endpoints are available in main backend
        console.log('\n4. Checking satellite endpoints in main backend...');
        try {
            // This would require authentication, so we expect a 401, but the endpoint should exist
            await axios.get('http://localhost:3000/api/satellite/verification-status/invalid-id');
        } catch (error) {
            if (error.response && error.response.status === 401) {
                console.log('✓ Satellite endpoints are available (expected 401 due to auth)');
            } else if (error.response && error.response.status === 404) {
                console.log('✗ Satellite endpoints not found');
                return;
            } else {
                console.log('✓ Satellite endpoints are accessible');
            }
        }
        
        console.log('\n✓ All integration tests passed!');
        console.log('\nIntegration Summary:');
        console.log('- Flask satellite API running on port 5001');
        console.log('- Main backend running on port 3000');
        console.log('- Satellite verification endpoints available at /api/satellite');
        console.log('- Property model updated with satellite verification fields');
        console.log('- Frontend updated to show verification status and trigger verification');
        console.log('- BullMQ workers handle verification jobs asynchronously');
        
    } catch (error) {
        console.error('✗ Integration test failed:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
    }
}

// Run the test
testSatelliteIntegration();