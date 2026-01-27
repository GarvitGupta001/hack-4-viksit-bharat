"use client";
// API service for CarbonCoin marketplace
const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000/api";

// Create a base API client with common headers
const apiClient = {
    async request(endpoint, options = {}) {
        const url = `${API_BASE_URL}${endpoint}`;

        const config = {
            headers: {
                "Content-Type": "application/json",
                ...options.headers,
            },
            ...options,
        };

        // Add auth token if available
        const token = localStorage.getItem("token");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        try {
            const response = await fetch(url, config);

            // Handle different response statuses
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(
                    errorData.message ||
                        `HTTP error! status: ${response.status}`,
                );
            }

            return await response.json();
        } catch (error) {
            console.error(`API request failed: ${url}`, error);
            throw error;
        }
    },

    // Authentication methods
    async register(userData) {
        return this.request("/auth/register", {
            method: "POST",
            body: JSON.stringify(userData),
        });
    },

    async login(credentials) {
        return this.request("/auth/login", {
            method: "POST",
            body: JSON.stringify(credentials),
        });
    },

    async getProfile() {
        return this.request("/auth/profile", {
            method: "GET",
        });
    },

    async updateProfile(profileData) {
        return this.request("/auth/profile", {
            method: "PUT",
            body: JSON.stringify(profileData),
        });
    },

    async logout() {
        // Clear local storage
        localStorage.removeItem("token");
        localStorage.removeItem("isLoggedIn");
        localStorage.removeItem("identityVerified");
        localStorage.removeItem("carbonCoins");
        localStorage.removeItem("userName");

        return { success: true, message: "Logged out successfully" };
    },

    // Seller methods
    async uploadSellerDocuments(documents) {
        const formData = new FormData();

        if (documents.selfie) {
            formData.append("selfie", documents.selfie);
        }

        if (documents.aadhar) {
            formData.append("aadhar", documents.aadhar);
        }

        return this.request("/sellers/upload-documents", {
            method: "POST",
            body: formData,
            // Don't set Content-Type header for multipart/form-data
            headers: {},
        });
    },

    async getSellerProfile() {
        return this.request("/sellers/profile", {
            method: "GET",
        });
    },

    async getAllSellers(params = {}) {
        const queryParams = new URLSearchParams(params).toString();
        const endpoint = queryParams
            ? `/sellers/all?${queryParams}`
            : "/sellers/all";

        return this.request(endpoint, {
            method: "GET",
        });
    },

    // Property methods
    async createProperty(propertyData, images) {
        const formData = new FormData();

        // Add property data fields
        Object.keys(propertyData).forEach((key) => {
            if (key === "boundaryCoordinates") {
                formData.append(key, JSON.stringify(propertyData[key]));
            } else {
                formData.append(key, propertyData[key]);
            }
        });

        // Add images
        if (images && images.length > 0) {
            for (let i = 0; i < images.length; i++) {
                formData.append("images", images[i]);
            }
        }

        return this.request("/properties/", {
            method: "POST",
            body: formData,
            // Don't set Content-Type header for multipart/form-data
            headers: {},
        });
    },

    async getProperty(id) {
        return this.request(`/properties/${id}`, {
            method: "GET",
        });
    },

    async getAllProperties(params = {}) {
        const queryParams = new URLSearchParams(params).toString();
        const endpoint = queryParams
            ? `/properties?${queryParams}`
            : "/properties";

        return this.request(endpoint, {
            method: "GET",
        });
    },

    async getMyProperties() {
        return this.request("/properties/my-properties", {
            method: "GET",
        });
    },

    async updateProperty(id, propertyData) {
        return this.request(`/properties/${id}`, {
            method: "PUT",
            body: JSON.stringify(propertyData),
        });
    },

    async deleteProperty(id) {
        return this.request(`/properties/${id}`, {
            method: "DELETE",
        });
    },

    // Carbon Coin methods
    async getCarbonCoinBalance() {
        return this.request("/carboncoins/balance", {
            method: "GET",
        });
    },

    async getCarbonCoinHistory(params = {}) {
        const queryParams = new URLSearchParams(params).toString();
        const endpoint = queryParams
            ? `/carboncoins/history?${queryParams}`
            : "/carboncoins/history";

        return this.request(endpoint, {
            method: "GET",
        });
    },

    async transferCarbonCoins(transferData) {
        return this.request("/carboncoins/transfer", {
            method: "POST",
            body: JSON.stringify(transferData),
        });
    },

    async getCarbonCoinLeaderboard(params = {}) {
        const queryParams = new URLSearchParams(params).toString();
        const endpoint = queryParams
            ? `/carboncoins/leaderboard?${queryParams}`
            : "/carboncoins/leaderboard";

        return this.request(endpoint, {
            method: "GET",
        });
    },

    async getMarketplaceStats() {
        return this.request("/carboncoins/stats", {
            method: "GET",
        });
    },

    // Company methods
    async uploadCompanyDocuments(documents) {
        const formData = new FormData();

        if (documents.logo) {
            formData.append("logo", documents.logo);
        }

        if (documents.registrationDoc) {
            formData.append("registrationDoc", documents.registrationDoc);
        }

        return this.request("/companies/upload-documents", {
            method: "POST",
            body: formData,
            // Don't set Content-Type header for multipart/form-data
            headers: {},
        });
    },

    async getCompanyProfile() {
        return this.request("/companies/profile", {
            method: "GET",
        });
    },

    async getAllCompanies(params = {}) {
        const queryParams = new URLSearchParams(params).toString();
        const endpoint = queryParams
            ? `/companies/all?${queryParams}`
            : "/companies/all";

        return this.request(endpoint, {
            method: "GET",
        });
    },
};

export default apiClient;
