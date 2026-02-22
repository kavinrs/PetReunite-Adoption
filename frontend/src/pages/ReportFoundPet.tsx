import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { reportFoundPet } from "../services/api";
import { useViewportStandardization } from "../hooks/useViewportStandardization";
import { useImageVerification } from "../hooks/useImageVerification";
import { usePetTypeVerification } from "../hooks/usePetTypeVerification";
import Toast from "../components/Toast";
import ImageVerificationBadge from "../components/ImageVerificationBadge";
import FakeImageAlert from "../components/FakeImageAlert";
import PetTypeMismatchAlert from "../components/PetTypeMismatchAlert";
import MultiImageUpload from "../components/MultiImageUpload";
import type { ImageWithVerification } from "../components/MultiImageUpload";

type Feedback = { type: "success" | "error"; message: string } | null;

const initialForm = {
  pet_name: "",
  pet_type: "",
  breed: "",
  gender: "",
  color: "",
  weight: "",
  estimated_age: "",
  found_city: "",
  state: "",
  pincode: "",
  description: "",
  location_url: "",
  found_time: "",
  has_tag: "not_present",
};

export default function ReportFoundPet() {
  // Apply viewport standardization to ensure consistent 100% scaling
  useViewportStandardization();
  const [form, setForm] = useState(initialForm);
  const [photo, setPhoto] = useState<File | null>(null);
  const [additionalImages, setAdditionalImages] = useState<ImageWithVerification[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [toast, setToast] = useState<{
    isVisible: boolean;
    type: "success" | "error";
    title: string;
    message: string;
  } | null>(null);
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState<string | null>(null);
  const [showFakeAlert, setShowFakeAlert] = useState(false);
  const [showPetTypeMismatchAlert, setShowPetTypeMismatchAlert] = useState(false);
  const navigate = useNavigate();

  // Image verification hook
  const {
    verificationResult,
    isVerifying,
    verificationError,
    verifyImage,
    clearVerification,
  } = useImageVerification();

  // Pet type verification hook
  const {
    verificationResult: petTypeResult,
    isVerifying: isPetTypeVerifying,
    verificationError: petTypeError,
    verifyPet,
    clearVerification: clearPetTypeVerification,
    hasShownMismatchAlert,
    markAlertShown,
  } = usePetTypeVerification();

  // Show/hide alert based on presence of fake images
  // Alert stays visible until ALL fake images are removed
  useEffect(() => {
    const mainPhotoIsFake = verificationResult && verificationResult.label === 'Fake';
    
    // Only count additional images that have completed verification (not still verifying)
    const additionalFakeImages = additionalImages.filter(img => 
      img.verificationStatus === 'fake_detected' && 
      img.verificationLabel === 'Fake'
    );
    const additionalFakeCount = additionalFakeImages.length;
    const totalFakeCount = (mainPhotoIsFake ? 1 : 0) + additionalFakeCount;
    
    console.log('Fake count check:', {
      mainPhotoIsFake,
      additionalFakeCount,
      totalFakeCount,
      additionalImages: additionalImages.map(img => ({
        status: img.verificationStatus,
        label: img.verificationLabel
      }))
    });
    
    // Show alert if there are ANY fake images
    // Hide alert automatically when all fake images are removed
    if (totalFakeCount > 0) {
      console.log('Fake images present, showing alert. Count:', totalFakeCount);
      setShowFakeAlert(true);
    } else {
      console.log('No fake images, hiding alert');
      setShowFakeAlert(false);
    }
  }, [verificationResult, additionalImages]);

  // Pet type verification effect
  // Run YOLO verification when: image is real AND pet type is entered
  useEffect(() => {
    const imageIsReal = verificationResult && verificationResult.label === 'Real';
    const hasPetType = form.pet_type.trim().length > 0;
    
    if (photo && imageIsReal && hasPetType) {
      console.log('🔍 Running pet type verification:', form.pet_type);
      verifyPet(photo, form.pet_type);
    } else if (!hasPetType) {
      // Clear verification if pet type is empty
      clearPetTypeVerification();
    }
  }, [photo, verificationResult, form.pet_type]);

  // Show pet type mismatch alert
  useEffect(() => {
    if (petTypeResult && petTypeResult.status === 'mismatch' && !hasShownMismatchAlert) {
      console.log('🚨 Pet type mismatch detected, showing alert');
      setShowPetTypeMismatchAlert(true);
      markAlertShown();
    }
  }, [petTypeResult, hasShownMismatchAlert, markAlertShown]);

  function handleChange(field: keyof typeof initialForm, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    
    // Clear pet type verification when user changes pet type
    if (field === 'pet_type') {
      clearPetTypeVerification();
    }
  }

  function handleUseCurrentLocation() {
    setLocError(null);
    if (!navigator.geolocation) {
      setLocError("Geolocation is not supported in this browser.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const url = `https://www.google.com/maps?q=${latitude},${longitude}`;
        setForm((prev) => ({ ...prev, location_url: url }));
        setLocating(false);
        setLocError(null);
      },
      (err) => {
        setLocating(false);
        let errorMessage = "Unable to fetch current location.";
        switch (err.code) {
          case err.PERMISSION_DENIED:
            errorMessage = "Location permission denied. Please allow location access in your browser settings.";
            break;
          case err.POSITION_UNAVAILABLE:
            errorMessage = "Location information is unavailable. Please try again or enter manually.";
            break;
          case err.TIMEOUT:
            errorMessage = "Location request timed out. Please try again or enter the location manually.";
            break;
        }
        setLocError(errorMessage);
      },
      { 
        enableHighAccuracy: false, // Set to false for faster response
        timeout: 30000, // Increased to 30 seconds
        maximumAge: 60000 // Allow cached position up to 1 minute old
      },
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    // Validate photo is required
    if (!photo) {
      setToast({
        isVisible: true,
        type: "error",
        title: "Photo Required",
        message: "Please upload a photo of the found pet."
      });
      return;
    }
    
    // Check if any image (main or additional) is fake
    const mainPhotoIsFake = verificationResult?.label === 'Fake';
    const additionalPhotoIsFake = additionalImages.some(img => img.verificationStatus === 'fake_detected');
    
    if (mainPhotoIsFake || additionalPhotoIsFake) {
      setToast({
        isVisible: true,
        type: "error",
        title: "Fake Image Detected",
        message: "Please remove all AI-generated images before submitting."
      });
      return;
    }
    
    setSubmitting(true);
    setFeedback(null);
    
    // First, submit the main report
    const res = await reportFoundPet({
      ...form,
      location_url: form.location_url,
      photo,
    });
    
    if (res.ok) {
      // If there are additional images, upload them
      if (additionalImages.length > 0 && res.data?.id) {
        const reportId = res.data.id;
        const additionalFiles = additionalImages.map(img => img.file);
        
        const { uploadFoundPetPhotos } = await import('../services/api');
        const uploadRes = await uploadFoundPetPhotos(reportId, additionalFiles);
        
        if (!uploadRes.ok) {
          console.error('Failed to upload additional photos:', uploadRes.error);
          // Still show success for main report, but warn about photos
          setToast({
            isVisible: true,
            type: "success",
            title: "Report Submitted",
            message: "Found pet report submitted successfully, but some additional photos failed to upload. Awaiting admin approval."
          });
        } else {
          setToast({
            isVisible: true,
            type: "success",
            title: "Success",
            message: "Found pet report submitted successfully! Awaiting admin approval."
          });
        }
      } else {
        setToast({
          isVisible: true,
          type: "success",
          title: "Success",
          message: "Found pet report submitted successfully! Awaiting admin approval."
        });
      }
      
      // Reset form
      setForm(initialForm);
      setPhoto(null);
      setAdditionalImages([]);
      clearVerification();
    } else {
      setToast({
        isVisible: true,
        type: "error",
        title: "Error",
        message: res.error ?? "Unable to submit report. Please try again."
      });
    }
    setSubmitting(false);
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: 32,
        background: "#f5f7fb",
        fontFamily: "Inter, sans-serif",
        boxSizing: "border-box",
      }}
    >
      {toast && (
        <Toast
          type={toast.type}
          title={toast.title}
          message={toast.message}
          isVisible={toast.isVisible}
          onClose={() => setToast(null)}
        />
      )}
      
      {/* Fake Image Alert - Top notification */}
      {/* Alert stays visible until all fake images are removed */}
      {showFakeAlert && (
        <FakeImageAlert
          show={showFakeAlert}
          onClose={() => {}} // No manual close - alert hides automatically when fakes are removed
        />
      )}
      
      {/* Pet Type Mismatch Alert */}
      {showPetTypeMismatchAlert && petTypeResult && petTypeResult.status === 'mismatch' && (
        <PetTypeMismatchAlert
          show={showPetTypeMismatchAlert}
          detectedType={petTypeResult.detected_type || 'Unknown'}
          userInput={petTypeResult.user_input}
          onClose={() => setShowPetTypeMismatchAlert(false)}
        />
      )}
      
      <div
        style={{
          maxWidth: 940,
          margin: "0 auto",
          background: "white",
          borderRadius: 20,
          boxShadow: "0 20px 60px rgba(15,23,42,0.12)",
          padding: 32,
          border: "1px solid rgba(15,23,42,0.08)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 24,
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div>
            <div style={{ fontSize: 28, fontWeight: 800, color: "#0f172a" }}>
              Report Found Pet
            </div>
            <p
              style={{
                margin: "6px 0 0",
                color: "rgba(15,23,42,0.6)",
                maxWidth: 640,
              }}
            >
              Share details about the pet you’ve found so the family can be
              reunited as quickly as possible.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate("/user")}
            style={{
              border: "none",
              background: "transparent",
              color: "#2563eb",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            ← Back to dashboard
          </button>
        </div>

        {feedback && (
          <div
            style={{
              marginBottom: 20,
              padding: "12px 16px",
              borderRadius: 12,
              border: `1px solid ${feedback.type === "success" ? "rgba(34,197,94,0.4)" : "rgba(248,113,113,0.4)"}`,
              background:
                feedback.type === "success"
                  ? "rgba(34,197,94,0.12)"
                  : "rgba(248,113,113,0.12)",
              color: feedback.type === "success" ? "#15803d" : "#b91c1c",
              fontWeight: 600,
            }}
          >
            {feedback.message}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: 18 }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: 16,
            }}
          >
            <div>
              <label style={labelStyle}>Tag (Name Tag on Pet)</label>
              <select
                value={form.has_tag}
                onChange={(e) => {
                  handleChange("has_tag" as any, e.target.value);
                  // Clear pet name if tag is not present
                  if (e.target.value === "not_present") {
                    handleChange("pet_name", "");
                  }
                }}
                style={inputStyle}
              >
                <option value="not_present">Not Present</option>
                <option value="present">Present</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>
                Pet Name {form.has_tag === "present" ? "(from tag)" : "(if known)"}
              </label>
              <input
                type="text"
                value={form.has_tag === "not_present" ? "" : form.pet_name}
                onChange={(e) => handleChange("pet_name", e.target.value)}
                style={{
                  ...inputStyle,
                  background: form.has_tag === "not_present" ? "#f3f4f6" : "#fff",
                }}
                placeholder={form.has_tag === "present" ? "Enter name from tag" : "No tag - name unknown"}
                disabled={form.has_tag === "not_present"}
              />
            </div>
            <div>
              <label style={labelStyle}>
                Pet Type (Dog, Cat, etc.)
                <span style={{ color: "#f97316" }}> *</span>
              </label>
              <input
                type="text"
                required
                value={form.pet_type}
                onChange={(e) => handleChange("pet_type", e.target.value)}
                onBlur={() => {
                  // Trigger verification on blur if conditions are met
                  if (photo && verificationResult?.label === 'Real' && form.pet_type.trim()) {
                    verifyPet(photo, form.pet_type);
                  }
                }}
                style={{
                  ...inputStyle,
                  borderColor: petTypeResult?.status === 'mismatch' 
                    ? '#ef4444' 
                    : petTypeResult?.status === 'verified'
                    ? '#22c55e'
                    : 'rgba(15,23,42,0.15)'
                }}
                placeholder="Dog, Cat, etc."
              />
              
              {/* Pet Type Verification Status */}
              {isPetTypeVerifying && (
                <div style={{ marginTop: 8, fontSize: 13, color: "#6b7280", display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ animation: 'spin 1s linear infinite' }}>🔍</span>
                  Verifying pet type...
                </div>
              )}
              
              {petTypeError && (
                <div style={{ marginTop: 8, fontSize: 13, color: "#dc2626" }}>
                  ⚠️ {petTypeError}
                </div>
              )}
              
              {petTypeResult && petTypeResult.status === 'verified' && (
                <div style={{ 
                  marginTop: 8, 
                  fontSize: 13, 
                  color: "#16a34a",
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}>
                  ✅ Pet type verified
                </div>
              )}
              
              {petTypeResult && petTypeResult.status === 'mismatch' && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ 
                    fontSize: 13, 
                    color: "#dc2626",
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    marginBottom: 4
                  }}>
                    ❌ Wrong pet type
                  </div>
                  {petTypeResult.suggestion && (
                    <div style={{ fontSize: 12, color: "#6b7280" }}>
                      {petTypeResult.suggestion}
                    </div>
                  )}
                </div>
              )}
              
              {petTypeResult && petTypeResult.status === 'uncertain' && (
                <div style={{ marginTop: 8, fontSize: 13, color: "#f59e0b" }}>
                  ⚠️ {petTypeResult.message}
                </div>
              )}
              
              {petTypeResult && petTypeResult.status === 'no_detection' && (
                <div style={{ marginTop: 8, fontSize: 13, color: "#dc2626" }}>
                  ⚠️ {petTypeResult.message}
                </div>
              )}
            </div>
            <div>
              <label style={labelStyle}>Breed (if identifiable)</label>
              <input
                type="text"
                value={form.breed}
                onChange={(e) => handleChange("breed", e.target.value)}
                style={inputStyle}
                placeholder="Breed"
              />
            </div>
            <div>
              <label style={labelStyle}>Gender</label>
              <select
                value={form.gender}
                onChange={(e) => handleChange("gender" as any, e.target.value)}
                style={inputStyle}
              >
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Unknown">Unknown</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Color</label>
              <input
                type="text"
                value={form.color}
                onChange={(e) => handleChange("color", e.target.value)}
                style={inputStyle}
                placeholder="Primary colors"
              />
            </div>
            <div>
              <label style={labelStyle}>Weight</label>
              <input
                type="text"
                value={form.weight}
                onChange={(e) => handleChange("weight" as any, e.target.value)}
                style={inputStyle}
                placeholder="Approximate weight"
              />
            </div>
            <div>
              <label style={labelStyle}>Estimated Age (years)</label>
              <input
                type="text"
                value={form.estimated_age}
                onChange={(e) => handleChange("estimated_age", e.target.value)}
                style={inputStyle}
                placeholder="Approximate age"
              />
            </div>
            <div>
              <label style={labelStyle}>
                Found in City<span style={{ color: "#f97316" }}> *</span>
              </label>
              <input
                type="text"
                required
                value={form.found_city}
                onChange={(e) => handleChange("found_city", e.target.value)}
                style={inputStyle}
                placeholder="City"
              />
            </div>
            <div>
              <label style={labelStyle}>
                State<span style={{ color: "#f97316" }}> *</span>
              </label>
              <input
                type="text"
                required
                value={form.state}
                onChange={(e) => handleChange("state", e.target.value)}
                style={inputStyle}
                placeholder="State"
              />
            </div>
            <div>
              <label style={labelStyle}>
                Pincode<span style={{ color: "#f97316" }}> *</span>
              </label>
              <input
                type="text"
                required
                value={form.pincode}
                onChange={(e) => handleChange("pincode" as any, e.target.value)}
                style={inputStyle}
                placeholder="Area pincode"
              />
            </div>
            <div>
              <label style={labelStyle}>
                Upload Photo<span style={{ color: "#f97316" }}> *</span>
              </label>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "11px 12px",
                  borderRadius: 12,
                  border: photo ? "1px solid rgba(15,23,42,0.15)" : "1px solid rgba(249,115,22,0.4)",
                  background: "#fff",
                }}
              >
                <label
                  style={{
                    padding: "6px 14px",
                    borderRadius: 6,
                    background: "#374151",
                    color: "#fff",
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  Choose File
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0] ?? null;
                      setPhoto(file);
                      clearVerification();
                      
                      // Automatically verify image when uploaded
                      if (file) {
                        await verifyImage(file);
                      }
                    }}
                    style={{ display: "none" }}
                  />
                </label>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 8,
                  flex: 1,
                  minWidth: 0,
                }}>
                  <span style={{ 
                    fontSize: 13, 
                    color: photo ? "#16a34a" : "#9ca3af", 
                    fontWeight: photo ? 500 : 400,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {photo ? photo.name : "No file chosen"}
                  </span>
                  {photo && (
                    <button
                      type="button"
                      onClick={() => {
                        setPhoto(null);
                        clearVerification();
                      }}
                      style={{
                        background: '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: 4,
                        width: 24,
                        height: 24,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        fontSize: 16,
                        fontWeight: 'bold',
                        flexShrink: 0,
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#dc2626';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#ef4444';
                      }}
                      title="Remove image"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>
              
              {/* Image verification status */}
              {isVerifying && (
                <div style={{ marginTop: 8, fontSize: 13, color: "#6b7280" }}>
                  🔍 Verifying image authenticity...
                </div>
              )}
              
              {verificationError && (
                <div style={{ marginTop: 8, fontSize: 13, color: "#dc2626" }}>
                  ⚠️ {verificationError}
                </div>
              )}
              
              {verificationResult && (
                <ImageVerificationBadge
                  label={verificationResult.label}
                  confidence={verificationResult.confidence}
                  warning={verificationResult.warning}
                />
              )}
            </div>
            
            {/* Additional Images Section */}
            <div>
              <label style={labelStyle}>
                Additional Images (Optional)
              </label>
              <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 12 }}>
                Upload up to 5 additional photos to help identify the pet. Each image will be verified for authenticity.
              </p>
              <MultiImageUpload
                images={additionalImages}
                onImagesChange={setAdditionalImages}
                maxImages={5}
                disabled={submitting}
              />
            </div>
            
            <div>
              <label style={labelStyle}>
                Found Time<span style={{ color: "#f97316" }}> *</span>
              </label>
              <input
                type="datetime-local"
                required
                value={form.found_time}
                onChange={(e) => handleChange("found_time" as any, e.target.value)}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>
                Location URL<span style={{ color: "#f97316" }}> *</span>
              </label>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <input
                  type="text"
                  required
                  value={form.location_url ?? ""}
                  onChange={(e) => handleChange("location_url" as any, e.target.value)}
                  style={inputStyle}
                  placeholder="Paste a map link or use 'Get current location'"
                />
                <button
                  type="button"
                  onClick={handleUseCurrentLocation}
                  disabled={locating}
                  style={{
                    alignSelf: "flex-start",
                    borderRadius: 999,
                    border: "none",
                    padding: "8px 14px",
                    background:
                      "linear-gradient(90deg, rgba(59,130,246,1), rgba(56,189,248,1))",
                    color: "white",
                    fontWeight: 600,
                    fontSize: 12,
                    cursor: locating ? "not-allowed" : "pointer",
                    boxShadow: "0 6px 18px rgba(59,130,246,0.35)",
                  }}
                >
                  {locating ? "Getting location..." : "Get current location"}
                </button>
                {locError && (
                  <div
                    style={{
                      fontSize: 11,
                      color: "#b91c1c",
                    }}
                  >
                    {locError}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div>
            <label style={labelStyle}>
              Description (where found, condition, behavior, etc.)
              <span style={{ color: "#f97316" }}> *</span>
            </label>
            <textarea
              required
              value={form.description}
              onChange={(e) => handleChange("description", e.target.value)}
              style={{
                ...inputStyle,
                minHeight: 140,
                resize: "vertical",
              }}
              placeholder="Share any helpful details"
            />
          </div>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 14,
              justifyContent: "space-between",
            }}
          >
            <button
              type="button"
              onClick={() => navigate("/user")}
              style={{
                flex: "1 1 200px",
                border: "none",
                borderRadius: 999,
                padding: "14px 18px",
                background: "rgba(15,23,42,0.05)",
                color: "#0f172a",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                submitting || 
                (verificationResult?.label === 'Fake') || 
                additionalImages.some(img => img.verificationStatus === 'fake_detected') ||
                additionalImages.some(img => img.verificationStatus === 'verifying') ||
                isPetTypeVerifying ||
                (petTypeResult?.status === 'mismatch')
              }
              style={{
                flex: "1 1 260px",
                border: "none",
                borderRadius: 999,
                padding: "14px 18px",
                background: (
                  submitting || 
                  verificationResult?.label === 'Fake' || 
                  additionalImages.some(img => img.verificationStatus === 'fake_detected') ||
                  additionalImages.some(img => img.verificationStatus === 'verifying') ||
                  isPetTypeVerifying ||
                  petTypeResult?.status === 'mismatch'
                )
                  ? "rgba(16,185,129,0.6)"
                  : "linear-gradient(90deg,#16a34a,#22c55e)",
                color: "white",
                fontWeight: 700,
                cursor: (
                  submitting || 
                  verificationResult?.label === 'Fake' || 
                  additionalImages.some(img => img.verificationStatus === 'fake_detected') ||
                  additionalImages.some(img => img.verificationStatus === 'verifying') ||
                  isPetTypeVerifying ||
                  petTypeResult?.status === 'mismatch'
                ) ? "not-allowed" : "pointer",
                boxShadow: "0 12px 30px rgba(34,197,94,0.35)",
                opacity: (
                  verificationResult?.label === 'Fake' || 
                  additionalImages.some(img => img.verificationStatus === 'fake_detected') ||
                  petTypeResult?.status === 'mismatch'
                ) ? 0.5 : 1,
              }}
            >
              {submitting 
                ? "Submitting..." 
                : isPetTypeVerifying
                  ? "Verifying Pet Type..."
                  : additionalImages.some(img => img.verificationStatus === 'verifying')
                    ? "Verifying Images..."
                    : petTypeResult?.status === 'mismatch'
                      ? "Cannot Submit - Wrong Pet Type"
                      : (verificationResult?.label === 'Fake' || additionalImages.some(img => img.verificationStatus === 'fake_detected'))
                        ? "Cannot Submit - Fake Image" 
                        : "Report Found Pet"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 13,
  fontWeight: 600,
  marginBottom: 6,
  color: "rgba(15,23,42,0.85)",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "11px 12px",
  borderRadius: 12,
  border: "1px solid rgba(15,23,42,0.15)",
  background: "#fff",
  fontSize: 14,
  color: "#0f172a",
  boxSizing: "border-box",
};
