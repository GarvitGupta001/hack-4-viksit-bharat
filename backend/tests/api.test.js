const http = require("http");
const https = require("https");

const API_BASE_URL = "http://localhost:3000/api";
let authToken = null;
let testUserId = null;

// Test utilities
const log = (title, status, details = "") => {
    const statusColor = status === "✓ PASS" ? "\x1b[32m" : "\x1b[31m";
    console.log(
        `\n${statusColor}${status}\x1b[0m ${title}`,
        details ? `\n  ${details}` : "",
    );
};

const makeRequest = (method, url, data = null, headers = {}) => {
    return new Promise((resolve) => {
        const urlObj = new URL(url);
        const protocol = urlObj.protocol === "https:" ? https : http;
        const options = {
            method,
            hostname: urlObj.hostname,
            port: urlObj.port || (urlObj.protocol === "https:" ? 443 : 80),
            path: urlObj.pathname + urlObj.search,
            headers: {
                "Content-Type": "application/json",
                ...headers,
            },
        };

        const req = protocol.request(options, (res) => {
            let body = "";
            res.on("data", (chunk) => (body += chunk));
            res.on("end", () => {
                try {
                    const jsonBody = body ? JSON.parse(body) : {};
                    resolve({
                        success: res.statusCode >= 200 && res.statusCode < 300,
                        status: res.statusCode,
                        data: jsonBody,
                    });
                } catch {
                    resolve({
                        success: res.statusCode >= 200 && res.statusCode < 300,
                        status: res.statusCode,
                        data: body,
                    });
                }
            });
        });

        req.on("error", (err) => {
            resolve({
                success: false,
                status: 0,
                error: err.message,
            });
        });

        if (data) {
            req.write(JSON.stringify(data));
        }
        req.end();
    });
};

const testEndpoint = async (method, url, data = null, headers = {}) => {
    try {
        const result = await makeRequest(method, url, data, headers);
        return result;
    } catch (error) {
        return {
            success: false,
            status: 0,
            error: error.message,
        };
    }
};

// Test suites
const runTests = async () => {
    console.log("\n========== API ENDPOINT TESTS ==========\n");

    // 1. Test root endpoint
    console.log("--- Health Check ---");
    let result = await testEndpoint("GET", "http://localhost:3000/");
    if (result.success && result.status === 200) {
        log("GET / - Health Check", "✓ PASS", JSON.stringify(result.data));
    } else {
        log("GET / - Health Check", "✗ FAIL", JSON.stringify(result.error));
    }

    // 2. Test Register
    console.log("\n--- Authentication Endpoints ---");
    const testUser = {
        email: `test${Date.now()}@example.com`,
        password: "Test@1234",
        name: "Test User",
        userType: "individual",
    };

    result = await testEndpoint("POST", `${API_BASE_URL}/auth/register`, testUser);
    if (result.success && result.status === 201) {
        log(
            "POST /api/auth/register - Register User",
            "✓ PASS",
            `User created: ${testUser.email}`,
        );
        testUserId = result.data.data._id || result.data.data.id;
    } else {
        log(
            "POST /api/auth/register - Register User",
            "✗ FAIL",
            JSON.stringify(result.error),
        );
    }

    // 3. Test Login
    result = await testEndpoint("POST", `${API_BASE_URL}/auth/login`, {
        email: testUser.email,
        password: testUser.password,
    });
    if (result.success && result.status === 200) {
        authToken = result.data.data.token;
        log(
            "POST /api/auth/login - Login User",
            "✓ PASS",
            `Token: ${authToken?.substring(0, 20)}...`,
        );
    } else {
        log(
            "POST /api/auth/login - Login User",
            "✗ FAIL",
            JSON.stringify(result.error),
        );
    }

    // 4. Test Protected Routes
    console.log("\n--- Protected Routes ---");

    // Test Get Profile
    result = await testEndpoint("GET", `${API_BASE_URL}/auth/profile`, null, {
        Authorization: `Bearer ${authToken}`,
    });
    if (result.success && result.status === 200) {
        log(
            "GET /api/auth/profile - Get Profile",
            "✓ PASS",
            `Profile fetched for: ${result.data.data?.email}`,
        );
    } else {
        log(
            "GET /api/auth/profile - Get Profile",
            "✗ FAIL",
            JSON.stringify(result.error),
        );
    }

    // Test Update Profile
    const updateData = {
        name: "Updated Test User",
        bio: "This is a test bio",
    };
    result = await testEndpoint("PUT", `${API_BASE_URL}/auth/profile`, updateData, {
        Authorization: `Bearer ${authToken}`,
    });
    if (result.success && result.status === 200) {
        log(
            "PUT /api/auth/profile - Update Profile",
            "✓ PASS",
            `Profile updated: ${result.data.data?.name}`,
        );
    } else {
        log(
            "PUT /api/auth/profile - Update Profile",
            "✗ FAIL",
            JSON.stringify(result.error),
        );
    }

    // Test Logout
    result = await testEndpoint("POST", `${API_BASE_URL}/auth/logout`, {}, {
        Authorization: `Bearer ${authToken}`,
    });
    if (result.success && result.status === 200) {
        log("POST /api/auth/logout - Logout", "✓ PASS", "User logged out successfully");
    } else {
        log("POST /api/auth/logout - Logout", "✗ FAIL", JSON.stringify(result.error));
    }

    // 5. Test Error Cases
    console.log("\n--- Error Cases ---");

    // Test Missing credentials on login
    result = await testEndpoint("POST", `${API_BASE_URL}/auth/login`, {
        email: "test@example.com",
    });
    if (!result.success || result.status === 400) {
        log(
            "POST /api/auth/login - Missing Password",
            "✓ PASS",
            "Correctly rejected incomplete request",
        );
    } else {
        log(
            "POST /api/auth/login - Missing Password",
            "✗ FAIL",
            "Should have rejected request",
        );
    }

    // Test Protected route without token
    result = await testEndpoint("GET", `${API_BASE_URL}/auth/profile`);
    if (!result.success) {
        log(
            "GET /api/auth/profile - No Token",
            "✓ PASS",
            "Correctly rejected unauthorized access",
        );
    } else {
        log(
            "GET /api/auth/profile - No Token",
            "✗ FAIL",
            "Should have rejected unauthorized request",
        );
    }

    // Test invalid email format on register
    result = await testEndpoint("POST", `${API_BASE_URL}/auth/register`, {
        email: "invalid-email",
        password: "Test@1234",
        name: "Test User",
        userType: "individual",
    });
    if (!result.success) {
        log(
            "POST /api/auth/register - Invalid Email",
            "✓ PASS",
            "Correctly rejected invalid email",
        );
    } else {
        log(
            "POST /api/auth/register - Invalid Email",
            "✗ FAIL",
            "Should have rejected invalid email",
        );
    }

    console.log("\n========== TESTS COMPLETED ==========\n");
};

// Run tests
runTests().catch((err) => {
    console.error("Test suite failed:", err.message);
    process.exit(1);
});
