"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";
import apiClient from "@/services/api";

const EnhancedMapComponent = dynamic(
    () => import("@/components/EnhancedMapComponent"),
    {
        ssr: false, // This is the key line
        loading: () => (
            <div className="p-4 bg-gray-100 rounded">Loading Map...</div>
        ), // Optional placeholder
    },
);

const EnhancedPropertyVerificationPage = () => {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        address: "",
        areaInSqFt: "",
        boundaryCoordinates: [],
    });
    const [images, setImages] = useState([]);
    const [previewImages, setPreviewImages] = useState([]);
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [coordinateInputMode, setCoordinateInputMode] = useState("map"); // "map" or "manual"
    const [manualCoordinates, setManualCoordinates] = useState("");
    const router = useRouter();

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value,
        });

        if (errors[name]) {
            setErrors({
                ...errors,
                [name]: "",
            });
        }
    };

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);

        const validFiles = files.filter(
            (file) =>
                file.type.match("image/jpeg") || file.type.match("image/png"),
        );

        if (validFiles.length !== files.length) {
            setErrors({
                ...errors,
                images: "Only JPG and PNG files are allowed",
            });
        }

        setImages((prev) => [...prev, ...validFiles]);

        validFiles.forEach((file) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewImages((prev) => [...prev, reader.result]);
            };
            reader.readAsDataURL(file);
        });
    };

    const removeImage = (index) => {
        setImages((prev) => prev.filter((_, i) => i !== index));
        setPreviewImages((prev) => prev.filter((_, i) => i !== index));
    };

    const handleCoordinatesChange = (coordinates) => {
        setFormData((prev) => ({
            ...prev,
            boundaryCoordinates: coordinates,
        }));

        if (errors.boundaryCoordinates) {
            setErrors((prev) => ({
                ...prev,
                boundaryCoordinates: "",
            }));
        }
    };

    const handleManualCoordinatesChange = (e) => {
        const value = e.target.value;
        setManualCoordinates(value);

        // Parse and validate coordinates
        try {
            const lines = value
                .trim()
                .split("\n")
                .filter((line) => line.trim());
            const coords = lines.map((line) => {
                const [lng, lat] = line
                    .trim()
                    .split(/[,\s]+/)
                    .map(Number);
                if (isNaN(lng) || isNaN(lat))
                    throw new Error("Invalid coordinate");
                return [lng, lat];
            });

            if (coords.length > 0) {
                setFormData((prev) => ({
                    ...prev,
                    boundaryCoordinates: coords,
                }));

                if (errors.boundaryCoordinates) {
                    setErrors((prev) => ({
                        ...prev,
                        boundaryCoordinates: "",
                    }));
                }
            }
        } catch (error) {
            // Keep the text input but don't update coordinates yet
        }
    };

    const toggleCoordinateMode = () => {
        const newMode = coordinateInputMode === "map" ? "manual" : "map";
        setCoordinateInputMode(newMode);

        // Sync manual text with current coordinates when switching to manual mode
        if (newMode === "manual" && formData.boundaryCoordinates.length > 0) {
            const coordText = formData.boundaryCoordinates
                .map((coord) => `${coord[0]}, ${coord[1]}`)
                .join("\n");
            setManualCoordinates(coordText);
        }
    };

    const validateStep1 = () => {
        const newErrors = {};

        if (!formData.title.trim()) {
            newErrors.title = "Title is required";
        }

        if (!formData.description.trim()) {
            newErrors.description = "Description is required";
        }

        if (!formData.address.trim()) {
            newErrors.address = "Address is required";
        }

        if (
            !formData.areaInSqFt ||
            isNaN(formData.areaInSqFt) ||
            parseFloat(formData.areaInSqFt) <= 0
        ) {
            newErrors.areaInSqFt = "Valid area in sq ft is required";
        }

        if (
            !formData.boundaryCoordinates ||
            !Array.isArray(formData.boundaryCoordinates) ||
            formData.boundaryCoordinates.length === 0
        ) {
            newErrors.boundaryCoordinates =
                "Boundary coordinates are required for satellite verification";
        } else {
            const isValid = formData.boundaryCoordinates.every(
                (coord) =>
                    Array.isArray(coord) &&
                    coord.length === 2 &&
                    typeof coord[0] === "number" &&
                    typeof coord[1] === "number",
            );

            if (!isValid) {
                newErrors.boundaryCoordinates =
                    "Each coordinate must be an array with 2 numbers [longitude, latitude]";
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const validateStep2 = () => {
        if (images.length === 0) {
            setErrors({ images: "At least one image is required" });
            return false;
        }
        return true;
    };

    const handleNext = () => {
        if (step === 1) {
            if (validateStep1()) {
                setStep(2);
            }
        } else if (step === 2) {
            if (validateStep2()) {
                setStep(3);
            }
        }
    };

    const handlePrevious = () => {
        if (step > 1) {
            setStep(step - 1);
        }
    };

    const handleSubmit = async () => {
        if (!validateStep1() || !validateStep2()) {
            return;
        }

        setIsLoading(true);

        try {
            const propertyData = {
                ...formData,
                areaInSqFt: parseFloat(formData.areaInSqFt),
            };

            const response = await apiClient.createProperty(
                propertyData,
                images,
            );

            console.log("Property created successfully:", response);
            // router.push(`/dashboard/properties/${response.data._id}`);
            router.push("/dashboard");
        } catch (error) {
            console.error("Error creating property:", error);
            setErrors({
                submit:
                    error.response?.data?.message ||
                    "Failed to create property",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="page-container">
            <Navbar />

            <main className="main-content">
                <div className="container">
                    <div className="verification-page">
                        <div className="page-header">
                            <h1>Register New Property</h1>
                            <p className="subtitle">
                                Secure your property with blockchain
                                verification
                            </p>
                        </div>

                        <div className="progress-bar">
                            <div
                                className={`progress-step ${step >= 1 ? "active" : ""} ${step > 1 ? "completed" : ""}`}
                            >
                                <div className="step-number">1</div>
                                <div className="step-label">
                                    Property Details
                                </div>
                            </div>
                            <div
                                className={`progress-step ${step >= 2 ? "active" : ""} ${step > 2 ? "completed" : ""}`}
                            >
                                <div className="step-number">2</div>
                                <div className="step-label">Upload Images</div>
                            </div>
                            <div
                                className={`progress-step ${step >= 3 ? "active" : ""}`}
                            >
                                <div className="step-number">3</div>
                                <div className="step-label">
                                    Review & Submit
                                </div>
                            </div>
                        </div>

                        <div className="form-container">
                            {step === 1 && (
                                <div className="step-content">
                                    <h2
                                        style={{
                                            textAlign: "center",
                                            marginBottom: "2rem",
                                            color: "#2e7d32",
                                        }}
                                    >
                                        Step 1: Property Details
                                    </h2>

                                    <div className="form-group">
                                        <label htmlFor="title">
                                            Property Title *
                                        </label>
                                        <input
                                            type="text"
                                            id="title"
                                            name="title"
                                            value={formData.title}
                                            onChange={handleInputChange}
                                            placeholder="Enter property title"
                                            className={
                                                errors.title ? "error" : ""
                                            }
                                        />
                                        {errors.title && (
                                            <span className="error-message">
                                                {errors.title}
                                            </span>
                                        )}
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="description">
                                            Description *
                                        </label>
                                        <textarea
                                            id="description"
                                            name="description"
                                            value={formData.description}
                                            onChange={handleInputChange}
                                            placeholder="Describe your property"
                                            rows="4"
                                            className={
                                                errors.description
                                                    ? "error"
                                                    : ""
                                            }
                                        />
                                        {errors.description && (
                                            <span className="error-message">
                                                {errors.description}
                                            </span>
                                        )}
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="address">
                                            Address *
                                        </label>
                                        <input
                                            type="text"
                                            id="address"
                                            name="address"
                                            value={formData.address}
                                            onChange={handleInputChange}
                                            placeholder="Enter property address"
                                            className={
                                                errors.address ? "error" : ""
                                            }
                                        />
                                        {errors.address && (
                                            <span className="error-message">
                                                {errors.address}
                                            </span>
                                        )}
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="areaInSqFt">
                                            Area (sq ft) *
                                        </label>
                                        <input
                                            type="number"
                                            id="areaInSqFt"
                                            name="areaInSqFt"
                                            value={formData.areaInSqFt}
                                            onChange={handleInputChange}
                                            placeholder="Enter area in square feet"
                                            className={
                                                errors.areaInSqFt ? "error" : ""
                                            }
                                        />
                                        {errors.areaInSqFt && (
                                            <span className="error-message">
                                                {errors.areaInSqFt}
                                            </span>
                                        )}
                                    </div>

                                    <div className="form-group">
                                        <div
                                            style={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                alignItems: "center",
                                                marginBottom: "1rem",
                                            }}
                                        >
                                            <label>
                                                Boundary Coordinates *
                                            </label>
                                            <button
                                                type="button"
                                                onClick={toggleCoordinateMode}
                                                style={{
                                                    padding: "0.5rem 1rem",
                                                    backgroundColor: "#f5f5f5",
                                                    border: "1px solid #ddd",
                                                    borderRadius: "6px",
                                                    cursor: "pointer",
                                                    fontSize: "0.9rem",
                                                    fontWeight: "500",
                                                    transition: "all 0.3s ease",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "0.5rem",
                                                    color: "#333",
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.target.style.backgroundColor =
                                                        "#e0e0e0";
                                                    e.target.style.transform =
                                                        "translateY(-2px)";
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.target.style.backgroundColor =
                                                        "#f5f5f5";
                                                    e.target.style.transform =
                                                        "translateY(0)";
                                                }}
                                            >
                                                {coordinateInputMode === "map"
                                                    ? "Switch to Manual Entry"
                                                    : "Switch to Interactive Map"}
                                            </button>
                                        </div>

                                        {coordinateInputMode === "map" ? (
                                            <div>
                                                <div
                                                    style={{
                                                        marginBottom: "1rem",
                                                        padding: "1rem",
                                                        backgroundColor:
                                                            "#e3f2fd",
                                                        borderRadius: "8px",
                                                        border: "1px solid #90caf9",
                                                    }}
                                                >
                                                    <p
                                                        style={{
                                                            margin: 0,
                                                            fontSize: "0.9rem",
                                                            color: "#1976d2",
                                                        }}
                                                    >
                                                        📍 Click on the map to
                                                        mark boundary points.
                                                        Click the first point
                                                        again to close the
                                                        polygon.
                                                    </p>
                                                </div>
                                                <EnhancedMapComponent
                                                    onCoordinatesChange={
                                                        handleCoordinatesChange
                                                    }
                                                    initialCoordinates={
                                                        formData.boundaryCoordinates
                                                    }
                                                />
                                                {formData.boundaryCoordinates
                                                    .length > 0 && (
                                                    <div
                                                        style={{
                                                            marginTop: "1rem",
                                                            padding: "0.75rem",
                                                            backgroundColor:
                                                                "#f5f5f5",
                                                            borderRadius: "6px",
                                                            fontSize: "0.9rem",
                                                        }}
                                                    >
                                                        <strong>
                                                            Points marked:
                                                        </strong>{" "}
                                                        {
                                                            formData
                                                                .boundaryCoordinates
                                                                .length
                                                        }
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div>
                                                <div
                                                    style={{
                                                        marginBottom: "1rem",
                                                        padding: "1rem",
                                                        backgroundColor:
                                                            "#fff3e0",
                                                        borderRadius: "8px",
                                                        border: "1px solid #ffb74d",
                                                    }}
                                                >
                                                    <p
                                                        style={{
                                                            margin: 0,
                                                            fontSize: "0.9rem",
                                                            color: "#f57c00",
                                                        }}
                                                    >
                                                        📝 Enter coordinates as
                                                        longitude, latitude (one
                                                        pair per line)
                                                        <br />
                                                        Example: 77.2090,
                                                        28.6139
                                                    </p>
                                                </div>
                                                <textarea
                                                    value={manualCoordinates}
                                                    onChange={
                                                        handleManualCoordinatesChange
                                                    }
                                                    placeholder="77.2090, 28.6139&#10;77.2095, 28.6139&#10;77.2095, 28.6135&#10;77.2090, 28.6135"
                                                    rows="8"
                                                    style={{
                                                        width: "100%",
                                                        padding: "0.75rem",
                                                        fontSize: "0.95rem",
                                                        fontFamily: "monospace",
                                                        borderRadius: "6px",
                                                        border: errors.boundaryCoordinates
                                                            ? "1px solid #f44336"
                                                            : "1px solid #ddd",
                                                        resize: "vertical",
                                                    }}
                                                />
                                                {formData.boundaryCoordinates
                                                    .length > 0 && (
                                                    <div
                                                        style={{
                                                            marginTop: "1rem",
                                                            padding: "0.75rem",
                                                            backgroundColor:
                                                                "#f5f5f5",
                                                            borderRadius: "6px",
                                                            fontSize: "0.9rem",
                                                        }}
                                                    >
                                                        <strong>
                                                            Valid points:
                                                        </strong>{" "}
                                                        {
                                                            formData
                                                                .boundaryCoordinates
                                                                .length
                                                        }
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {errors.boundaryCoordinates && (
                                            <span className="error-message">
                                                {errors.boundaryCoordinates}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}

                            {step === 2 && (
                                <div className="step-content">
                                    <h2
                                        style={{
                                            textAlign: "center",
                                            marginBottom: "2rem",
                                            color: "#2e7d32",
                                        }}
                                    >
                                        Step 2: Upload Property Images
                                    </h2>

                                    <div className="form-group">
                                        <label htmlFor="images">
                                            Property Images *
                                        </label>
                                        <input
                                            type="file"
                                            id="images"
                                            multiple
                                            accept="image/jpeg,image/png"
                                            onChange={handleImageChange}
                                            className={
                                                errors.images ? "error" : ""
                                            }
                                        />
                                        <p
                                            style={{
                                                fontSize: "0.9rem",
                                                color: "#666",
                                                marginTop: "0.5rem",
                                            }}
                                        >
                                            Upload clear images of your property
                                            (JPG or PNG format)
                                        </p>
                                        {errors.images && (
                                            <span className="error-message">
                                                {errors.images}
                                            </span>
                                        )}

                                        <div
                                            style={{
                                                marginTop: "1rem",
                                                display: "flex",
                                                flexWrap: "wrap",
                                                gap: "1rem",
                                            }}
                                        >
                                            {previewImages.map(
                                                (preview, index) => (
                                                    <div
                                                        key={index}
                                                        style={{
                                                            position:
                                                                "relative",
                                                            width: "150px",
                                                            height: "150px",
                                                        }}
                                                    >
                                                        <img
                                                            src={preview}
                                                            alt={`Preview ${index}`}
                                                            className="preview-image"
                                                            style={{
                                                                width: "100%",
                                                                height: "100%",
                                                                objectFit:
                                                                    "cover",
                                                                borderRadius:
                                                                    "8px",
                                                            }}
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                removeImage(
                                                                    index,
                                                                )
                                                            }
                                                            style={{
                                                                position:
                                                                    "absolute",
                                                                top: "-8px",
                                                                right: "-8px",
                                                                background:
                                                                    "#f44336",
                                                                color: "white",
                                                                border: "none",
                                                                borderRadius:
                                                                    "50%",
                                                                width: "24px",
                                                                height: "24px",
                                                                cursor: "pointer",
                                                            }}
                                                        >
                                                            ×
                                                        </button>
                                                    </div>
                                                ),
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {step === 3 && (
                                <div className="step-content">
                                    <h2
                                        style={{
                                            textAlign: "center",
                                            marginBottom: "2rem",
                                            color: "#2e7d32",
                                        }}
                                    >
                                        Review & Submit
                                    </h2>

                                    <div className="review-summary">
                                        <h3>Property Details:</h3>
                                        <p>
                                            <strong>Title:</strong>{" "}
                                            {formData.title}
                                        </p>
                                        <p>
                                            <strong>Description:</strong>{" "}
                                            {formData.description}
                                        </p>
                                        <p>
                                            <strong>Address:</strong>{" "}
                                            {formData.address}
                                        </p>
                                        <p>
                                            <strong>Area:</strong>{" "}
                                            {formData.areaInSqFt} sq ft
                                        </p>
                                        <p>
                                            <strong>Boundary Points:</strong>{" "}
                                            {
                                                formData.boundaryCoordinates
                                                    .length
                                            }
                                        </p>
                                        <p>
                                            <strong>Images:</strong>{" "}
                                            {images.length} uploaded
                                        </p>
                                    </div>

                                    <div
                                        style={{
                                            marginTop: "2rem",
                                            textAlign: "center",
                                        }}
                                    >
                                        <p>
                                            By submitting, you agree that the
                                            information provided is accurate and
                                            that you have the right to register
                                            this property.
                                        </p>
                                    </div>
                                </div>
                            )}

                            <div
                                className="step-navigation"
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    marginTop: "2rem",
                                }}
                            >
                                <button
                                    onClick={handlePrevious}
                                    className="action-button secondary"
                                    disabled={step === 1 || isLoading}
                                    style={{ minWidth: "120px" }}
                                >
                                    Previous
                                </button>

                                {step < 3 ? (
                                    <button
                                        onClick={handleNext}
                                        className="action-button primary"
                                        disabled={isLoading}
                                        style={{ minWidth: "120px" }}
                                    >
                                        Next
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleSubmit}
                                        className="action-button primary"
                                        disabled={isLoading}
                                        style={{ minWidth: "120px" }}
                                    >
                                        {isLoading
                                            ? "Submitting..."
                                            : "Submit Property"}
                                    </button>
                                )}
                            </div>

                            <div
                                className="dashboard-actions"
                                style={{ fontSize: "1rem", marginTop: "2rem" }}
                            >
                                <Link
                                    href="/dashboard"
                                    className="action-button secondary"
                                >
                                    Back to Dashboard
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />

            <style jsx>{`
                .page-container {
                    min-height: 100vh;
                    display: flex;
                    flex-direction: column;
                }

                .main-content {
                    flex: 1;
                    padding: 2rem 1rem;
                    background: linear-gradient(
                        135deg,
                        #f5f7fa 0%,
                        #c3cfe2 100%
                    );
                }

                .container {
                    max-width: 900px;
                    margin: 0 auto;
                }

                .verification-page {
                    background: white;
                    border-radius: 12px;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                    padding: 2rem;
                }

                .page-header {
                    text-align: center;
                    margin-bottom: 2rem;
                }

                .page-header h1 {
                    color: #2e7d32;
                    font-size: 2rem;
                    margin-bottom: 0.5rem;
                }

                .subtitle {
                    color: #666;
                    font-size: 1rem;
                }

                .progress-bar {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 3rem;
                    position: relative;
                }

                .progress-bar::before {
                    content: "";
                    position: absolute;
                    top: 20px;
                    left: 10%;
                    right: 10%;
                    height: 2px;
                    background: #e0e0e0;
                    z-index: 0;
                }

                .progress-step {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    position: relative;
                    z-index: 1;
                    flex: 1;
                }

                .step-number {
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    background: #e0e0e0;
                    color: #999;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: bold;
                    margin-bottom: 0.5rem;
                    transition: all 0.3s ease;
                }

                .progress-step.active .step-number {
                    background: #2e7d32;
                    color: white;
                }

                .progress-step.completed .step-number {
                    background: #4caf50;
                    color: white;
                }

                .step-label {
                    font-size: 0.85rem;
                    color: #666;
                    text-align: center;
                }

                .progress-step.active .step-label {
                    color: #2e7d32;
                    font-weight: 600;
                }

                .form-container {
                    margin-top: 2rem;
                }

                .form-group {
                    margin-bottom: 1.5rem;
                }

                .form-group label {
                    display: block;
                    margin-bottom: 0.5rem;
                    font-weight: 600;
                    color: #333;
                }

                .form-group input,
                .form-group textarea {
                    width: 100%;
                    padding: 0.75rem;
                    border: 1px solid #ddd;
                    border-radius: 6px;
                    font-size: 1rem;
                    transition: border-color 0.3s ease;
                }

                .form-group input:focus,
                .form-group textarea:focus {
                    outline: none;
                    border-color: #2e7d32;
                }

                .form-group input.error,
                .form-group textarea.error {
                    border-color: #f44336;
                }

                .error-message {
                    display: block;
                    color: #f44336;
                    font-size: 0.85rem;
                    margin-top: 0.25rem;
                }

                .review-summary {
                    background: #f5f5f5;
                    padding: 1.5rem;
                    border-radius: 8px;
                    margin-bottom: 1rem;
                }

                .review-summary h3 {
                    margin-top: 0;
                    color: #2e7d32;
                }

                .review-summary p {
                    margin: 0.75rem 0;
                    line-height: 1.6;
                }

                .action-button {
                    padding: 0.75rem 1.5rem;
                    border: none;
                    border-radius: 6px;
                    font-size: 1rem;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    font-weight: 600;
                }

                .action-button.primary {
                    background: #2e7d32;
                    color: white;
                }

                .action-button.primary:hover:not(:disabled) {
                    background: #1b5e20;
                    transform: translateY(-2px);
                    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
                }

                .action-button.secondary {
                    background: #f5f5f5;
                    color: #333;
                    border: 1px solid #ddd;
                }

                .action-button.secondary:hover:not(:disabled) {
                    background: #e0e0e0;
                }

                .action-button:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }

                .dashboard-actions {
                    text-align: center;
                }

                .dashboard-actions .action-button {
                    display: inline-block;
                    text-decoration: none;
                }

                @media (max-width: 768px) {
                    .verification-page {
                        padding: 1.5rem;
                    }

                    .page-header h1 {
                        font-size: 1.5rem;
                    }

                    .progress-bar {
                        flex-direction: column;
                        gap: 1rem;
                    }

                    .progress-bar::before {
                        display: none;
                    }

                    .step-number {
                        width: 35px;
                        height: 35px;
                    }
                }
            `}</style>
        </div>
    );
};

export default EnhancedPropertyVerificationPage;
