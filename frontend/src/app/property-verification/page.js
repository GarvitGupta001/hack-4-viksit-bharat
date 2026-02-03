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
        ssr: false,
        loading: () => (
            <div className="p-4 bg-gray-100 rounded">Loading Map...</div>
        ),
    },
);

const EnhancedPropertyVerificationPage = () => {
    const [step, setStep] = useState(1);

    // Form Data State
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        address: "",
        areaInSqFt: "",
        boundaryCoordinates: [],
    });

    // File State
    const [images, setImages] = useState([]);
    const [previewImages, setPreviewImages] = useState([]);
    const [documentFile, setDocumentFile] = useState(null); // New state for PDF

    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);

    // Map/Coordinate Logic
    const [coordinateInputMode, setCoordinateInputMode] = useState("map");
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

    // --- Image Handling ---
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

    // --- PDF Document Handling (New) ---
    const handleDocumentChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.type === "application/pdf") {
                setDocumentFile(file);
                if (errors.document) {
                    setErrors({ ...errors, document: "" });
                }
            } else {
                setErrors({
                    ...errors,
                    document: "Only PDF files are allowed",
                });
            }
        }
    };

    const removeDocument = () => {
        setDocumentFile(null);
    };

    // --- Coordinate Handling ---
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
            // Keep text input, don't update state yet
        }
    };

    const toggleCoordinateMode = () => {
        const newMode = coordinateInputMode === "map" ? "manual" : "map";
        setCoordinateInputMode(newMode);
        if (newMode === "manual" && formData.boundaryCoordinates.length > 0) {
            const coordText = formData.boundaryCoordinates
                .map((coord) => `${coord[0]}, ${coord[1]}`)
                .join("\n");
            setManualCoordinates(coordText);
        }
    };

    // --- Validation ---
    const validateStep1 = () => {
        const newErrors = {};
        if (!formData.title.trim()) newErrors.title = "Title is required";
        if (!formData.description.trim())
            newErrors.description = "Description is required";
        if (!formData.address.trim()) newErrors.address = "Address is required";
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
            newErrors.boundaryCoordinates = "Boundary coordinates are required";
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const validateStep2 = () => {
        const newErrors = {};
        if (images.length === 0) {
            newErrors.images = "At least one image is required";
        }
        if (!documentFile) {
            newErrors.document = "Property document (PDF) is required";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // --- Navigation ---
    const handleNext = () => {
        if (step === 1 && validateStep1()) setStep(2);
        else if (step === 2 && validateStep2()) setStep(3);
    };

    const handlePrevious = () => {
        if (step > 1) setStep(step - 1);
    };

    const handleSubmit = async () => {
        if (!validateStep1() || !validateStep2()) return;
        setIsLoading(true);

        try {
            const propertyData = {
                ...formData,
                areaInSqFt: parseFloat(formData.areaInSqFt),
            };

            // Assuming API can handle documentFile as a 3rd arg or inside formData
            const response = await apiClient.createProperty(
                propertyData,
                images,
                documentFile,
            );

            console.log("Property created successfully:", response);
            router.push("/dashboard");
        } catch (error) {
            console.error('Property creation error:', error);

            // Check if it's a property overlap error
            if (error.message.includes('Property overlaps with existing property')) {
                alert(`Property Overlap Detected!\n\n${error.message}\n\nPlease adjust your property boundaries or contact support if you believe this is an error.`);
                setErrors({ api: 'Property overlap detected. Please adjust your boundaries.' });
            } else {
                setErrors({ api: error.message || 'Property creation failed. Please try again.' });
            }
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

                        {/* Progress Bar */}
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
                                <div className="step-label">Uploads</div>
                            </div>
                            <div
                                className={`progress-step ${step >= 3 ? "active" : ""}`}
                            >
                                <div className="step-number">3</div>
                                <div className="step-label">Review</div>
                            </div>
                        </div>

                        <div className="form-container">
                            {/* STEP 1: Details */}
                            {step === 1 && (
                                <div className="step-content">
                                    <h2 className="step-title">
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
                                        <div className="coord-header">
                                            <label>
                                                Boundary Coordinates *
                                            </label>
                                            <button
                                                type="button"
                                                onClick={toggleCoordinateMode}
                                                className="toggle-mode-btn"
                                            >
                                                {coordinateInputMode === "map"
                                                    ? "Switch to Manual Entry"
                                                    : "Switch to Interactive Map"}
                                            </button>
                                        </div>

                                        {coordinateInputMode === "map" ? (
                                            <div>
                                                <div className="info-box blue">
                                                    <p>
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
                                            </div>
                                        ) : (
                                            <div>
                                                <div className="info-box orange">
                                                    <p>
                                                        📝 Enter coordinates as
                                                        longitude, latitude (one
                                                        pair per line)
                                                    </p>
                                                </div>
                                                <textarea
                                                    value={manualCoordinates}
                                                    onChange={
                                                        handleManualCoordinatesChange
                                                    }
                                                    placeholder="77.2090, 28.6139&#10;77.2095, 28.6139"
                                                    rows="8"
                                                    className={`manual-coords ${errors.boundaryCoordinates ? "error" : ""}`}
                                                />
                                            </div>
                                        )}
                                        {formData.boundaryCoordinates.length >
                                            0 && (
                                                <div className="points-counter">
                                                    <strong>Points marked:</strong>{" "}
                                                    {
                                                        formData.boundaryCoordinates
                                                            .length
                                                    }
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

                            {/* STEP 2: Uploads */}
                            {step === 2 && (
                                <div className="step-content">
                                    <h2 className="step-title">
                                        Step 2: Upload Documents & Images
                                    </h2>

                                    {/* Image Upload */}
                                    <div className="form-group">
                                        <label htmlFor="images">
                                            Property Images *
                                        </label>
                                        <div className="file-upload-wrapper">
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
                                            <p className="helper-text">
                                                Upload clear images (JPG/PNG)
                                            </p>
                                        </div>
                                        {errors.images && (
                                            <span className="error-message">
                                                {errors.images}
                                            </span>
                                        )}

                                        <div className="image-previews">
                                            {previewImages.map(
                                                (preview, index) => (
                                                    <div
                                                        key={index}
                                                        className="preview-item"
                                                    >
                                                        <img
                                                            src={preview}
                                                            alt={`Preview ${index}`}
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                removeImage(
                                                                    index,
                                                                )
                                                            }
                                                        >
                                                            ×
                                                        </button>
                                                    </div>
                                                ),
                                            )}
                                        </div>
                                    </div>

                                    <hr className="divider" />

                                    {/* NEW: PDF Document Upload */}
                                    <div className="form-group">
                                        <label htmlFor="document">
                                            Property Documents (PDF) *
                                        </label>
                                        <div className="file-upload-wrapper">
                                            <input
                                                type="file"
                                                id="document"
                                                accept="application/pdf"
                                                onChange={handleDocumentChange}
                                                className={
                                                    errors.document
                                                        ? "error"
                                                        : ""
                                                }
                                            />
                                            <p className="helper-text">
                                                Upload property deed or
                                                ownership proof (PDF only)
                                            </p>
                                        </div>
                                        {documentFile && (
                                            <div className="file-selected-box">
                                                <span>
                                                    📄 {documentFile.name}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={removeDocument}
                                                    className="remove-file-btn"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        )}
                                        {errors.document && (
                                            <span className="error-message">
                                                {errors.document}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* STEP 3: Readable Review */}
                            {step === 3 && (
                                <div className="step-content">
                                    <h2 className="step-title">
                                        Review & Submit
                                    </h2>

                                    <div className="review-container">
                                        {/* Section 1: Basic Info */}
                                        <div className="review-section">
                                            <h3 className="review-heading">
                                                Property Information
                                            </h3>
                                            <div className="review-grid">
                                                <div className="review-item">
                                                    <span className="review-label">
                                                        Title
                                                    </span>
                                                    <span className="review-value">
                                                        {formData.title}
                                                    </span>
                                                </div>
                                                <div className="review-item">
                                                    <span className="review-label">
                                                        Area
                                                    </span>
                                                    <span className="review-value">
                                                        {formData.areaInSqFt} sq
                                                        ft
                                                    </span>
                                                </div>
                                                <div className="review-item full-width">
                                                    <span className="review-label">
                                                        Description
                                                    </span>
                                                    <span className="review-value">
                                                        {formData.description}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Section 2: Location */}
                                        <div className="review-section">
                                            <h3 className="review-heading">
                                                Location Details
                                            </h3>
                                            <div className="review-grid">
                                                <div className="review-item full-width">
                                                    <span className="review-label">
                                                        Address
                                                    </span>
                                                    <span className="review-value">
                                                        {formData.address}
                                                    </span>
                                                </div>
                                                <div className="review-item">
                                                    <span className="review-label">
                                                        Boundary Points
                                                    </span>
                                                    <span className="review-value">
                                                        {
                                                            formData
                                                                .boundaryCoordinates
                                                                .length
                                                        }{" "}
                                                        points marked
                                                    </span>
                                                </div>
                                                <div className="review-item">
                                                    <span className="review-label">
                                                        Coordinate Mode
                                                    </span>
                                                    <span
                                                        className="review-value"
                                                        style={{
                                                            textTransform:
                                                                "capitalize",
                                                        }}
                                                    >
                                                        {coordinateInputMode}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Section 3: Files */}
                                        <div className="review-section">
                                            <h3 className="review-heading">
                                                Attached Files
                                            </h3>
                                            <div className="review-grid">
                                                <div className="review-item">
                                                    <span className="review-label">
                                                        Images
                                                    </span>
                                                    <span className="review-value">
                                                        {images.length} file(s)
                                                        ready
                                                    </span>
                                                </div>
                                                <div className="review-item">
                                                    <span className="review-label">
                                                        Document
                                                    </span>
                                                    <span className="review-value">
                                                        {documentFile ? (
                                                            documentFile.name
                                                        ) : (
                                                            <span
                                                                style={{
                                                                    color: "red",
                                                                }}
                                                            >
                                                                Missing
                                                            </span>
                                                        )}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="disclaimer-box">
                                            <p>
                                                By submitting, you agree that
                                                the information provided is
                                                accurate and that you have the
                                                legal right to register this
                                                property.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Navigation Buttons */}
                            <div className="step-navigation">
                                <button
                                    onClick={handlePrevious}
                                    className="action-button secondary"
                                    disabled={step === 1 || isLoading}
                                >
                                    Previous
                                </button>

                                {step < 3 ? (
                                    <button
                                        onClick={handleNext}
                                        className="action-button primary"
                                        disabled={isLoading}
                                    >
                                        Next
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleSubmit}
                                        className="action-button primary"
                                        disabled={isLoading}
                                    >
                                        {isLoading
                                            ? "Submitting..."
                                            : "Submit Property"}
                                    </button>
                                )}
                            </div>

                            <div className="dashboard-actions">
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
                /* General Layout */
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
                    padding: 2.5rem;
                }

                /* Header & Titles */
                .page-header {
                    text-align: center;
                    margin-bottom: 2rem;
                }
                .page-header h1 {
                    color: #1b5e20;
                    font-size: 2rem;
                    margin-bottom: 0.5rem;
                }
                .subtitle {
                    color: #444;
                    font-size: 1.1rem;
                }
                .step-title {
                    text-align: center;
                    margin-bottom: 2rem;
                    color: #2e7d32;
                }

                /* Progress Bar - Contrast Fixes */
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
                    background: #bdbdbd;
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
                    color: #616161; /* Darker grey for visibility */
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: bold;
                    margin-bottom: 0.5rem;
                    border: 2px solid #e0e0e0;
                }
                .progress-step.active .step-number {
                    background: #2e7d32;
                    color: white;
                    border-color: #2e7d32;
                }
                .progress-step.completed .step-number {
                    background: #4caf50;
                    color: white;
                    border-color: #4caf50;
                }
                .step-label {
                    font-size: 0.9rem;
                    color: #444;
                    text-align: center;
                    font-weight: 500;
                }
                .progress-step.active .step-label {
                    color: #1b5e20;
                    font-weight: 700;
                }

                /* Forms */
                .form-container {
                    margin-top: 1rem;
                }
                .form-group {
                    margin-bottom: 1.5rem;
                }
                .form-group label {
                    display: block;
                    margin-bottom: 0.5rem;
                    font-weight: 600;
                    color: #222;
                }
                .form-group input[type="text"],
                .form-group input[type="number"],
                .form-group textarea,
                .manual-coords {
                    width: 100%;
                    padding: 0.75rem;
                    border: 1px solid #ccc;
                    border-radius: 6px;
                    font-size: 1rem;
                    color: #333;
                }
                .form-group input:focus,
                .form-group textarea:focus {
                    outline: none;
                    border-color: #2e7d32;
                    box-shadow: 0 0 0 2px rgba(46, 125, 50, 0.1);
                }
                .error {
                    border-color: #d32f2f !important;
                }
                .error-message {
                    display: block;
                    color: #d32f2f;
                    font-size: 0.85rem;
                    margin-top: 0.4rem;
                    font-weight: 500;
                }
                .helper-text {
                    font-size: 0.85rem;
                    color: #555;
                    margin-top: 0.4rem;
                }

                /* Coordinate Specifics */
                .coord-header {
                    display: flex;
                    justify-content: space-between;
                    alignitems: center;
                    margin-bottom: 1rem;
                }
                .toggle-mode-btn {
                    padding: 0.5rem 1rem;
                    background: #f5f5f5;
                    border: 1px solid #ccc;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 0.9rem;
                    color: #333;
                    font-weight: 600;
                }
                .toggle-mode-btn:hover {
                    background: #e0e0e0;
                }
                .info-box {
                    padding: 1rem;
                    border-radius: 8px;
                    margin-bottom: 1rem;
                }
                .info-box p {
                    margin: 0;
                    font-size: 0.9rem;
                    font-weight: 500;
                }
                .info-box.blue {
                    background: #e3f2fd;
                    border: 1px solid #90caf9;
                }
                .info-box.blue p {
                    color: #0d47a1; /* Darker blue */
                }
                .info-box.orange {
                    background: #fff3e0;
                    border: 1px solid #ffb74d;
                }
                .info-box.orange p {
                    color: #e65100; /* Darker orange */
                }
                .points-counter {
                    margin-top: 1rem;
                    padding: 0.75rem;
                    background: #f5f5f5;
                    border-radius: 6px;
                    font-size: 0.9rem;
                    color: #333;
                }

                /* File Upload Styles */
                .file-upload-wrapper input[type="file"] {
                    padding: 0.5rem;
                    background: #fafafa;
                    border: 1px dashed #ccc;
                    width: 100%;
                }
                .image-previews {
                    margin-top: 1rem;
                    display: flex;
                    flex-wrap: wrap;
                    gap: 1rem;
                }
                .preview-item {
                    position: relative;
                    width: 120px;
                    height: 120px;
                    border-radius: 8px;
                    overflow: hidden;
                    border: 1px solid #eee;
                }
                .preview-item img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }
                .preview-item button {
                    position: absolute;
                    top: 0;
                    right: 0;
                    background: rgba(244, 67, 54, 0.9);
                    color: white;
                    border: none;
                    width: 24px;
                    height: 24px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .divider {
                    margin: 2rem 0;
                    border: 0;
                    border-top: 1px solid #eee;
                }
                .file-selected-box {
                    margin-top: 0.5rem;
                    padding: 0.75rem;
                    background: #e8f5e9;
                    border: 1px solid #c8e6c9;
                    border-radius: 6px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    color: #2e7d32;
                    font-weight: 500;
                }
                .remove-file-btn {
                    background: none;
                    border: none;
                    color: #d32f2f;
                    cursor: pointer;
                    font-size: 0.85rem;
                    text-decoration: underline;
                }

                /* Step 3: Review Grid Layout */
                .review-container {
                    padding: 0 1rem;
                }
                .review-section {
                    margin-bottom: 2rem;
                    border-bottom: 1px solid #eee;
                    padding-bottom: 1.5rem;
                }
                .review-section:last-child {
                    border-bottom: none;
                }
                .review-heading {
                    color: #1b5e20;
                    margin-top: 0;
                    margin-bottom: 1rem;
                    font-size: 1.1rem;
                    border-left: 4px solid #4caf50;
                    padding-left: 0.75rem;
                }

                .review-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 1.5rem;
                }
                .review-item {
                    display: flex;
                    flex-direction: column;
                }
                .review-item.full-width {
                    grid-column: 1 / -1;
                }

                .review-label {
                    font-size: 0.85rem;
                    color: #666;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    margin-bottom: 0.25rem;
                }
                .review-value {
                    font-size: 1.05rem;
                    color: #222;
                    font-weight: 500;
                    word-break: break-word;
                }

                .disclaimer-box {
                    background: #fafafa;
                    padding: 1.5rem;
                    border-radius: 8px;
                    text-align: center;
                    border: 1px solid #eee;
                    margin-top: 1rem;
                }
                .disclaimer-box p {
                    color: #555;
                    margin: 0;
                    font-size: 0.9rem;
                }

                /* Buttons */
                .step-navigation {
                    display: flex;
                    justify-content: space-between;
                    margin-top: 2rem;
                    gap: 1rem;
                }
                .action-button {
                    padding: 0.85rem 1.5rem;
                    border: none;
                    border-radius: 6px;
                    font-size: 1rem;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    font-weight: 600;
                    min-width: 140px;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                }
                .action-button.primary {
                    background: #2e7d32;
                    color: white;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                }
                .action-button.primary:hover:not(:disabled) {
                    background: #1b5e20;
                    transform: translateY(-1px);
                }
                .action-button.secondary {
                    background: #fff;
                    color: #333;
                    border: 1px solid #ccc;
                }
                .action-button.secondary:hover:not(:disabled) {
                    background: #f5f5f5;
                    border-color: #bbb;
                }
                .action-button:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }
                .dashboard-actions {
                    text-align: center;
                    margin-top: 2rem;
                }
                .dashboard-actions .action-button {
                    text-decoration: none;
                }

                @media (max-width: 600px) {
                    .review-grid {
                        grid-template-columns: 1fr;
                    }
                    .verification-page {
                        padding: 1.5rem;
                    }
                }
            `}</style>
        </div>
    );
};

export default EnhancedPropertyVerificationPage;
