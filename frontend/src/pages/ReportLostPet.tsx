import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { reportLostPet } from "../services/api";
import { useViewportStandardization } from "../hooks/useViewportStandardization";
import { useImageVerification } from "../hooks/useImageVerification";
import { usePetTypeVerification } from "../hooks/usePetTypeVerification";
import { useBreedClassification } from "../hooks/useBreedClassification";
import Toast from "../components/Toast";
import ImageVerificationBadge from "../components/ImageVerificationBadge";
import FakeImageAlert from "../components/FakeImageAlert";
import PetTypeMismatchAlert from "../components/PetTypeMismatchAlert";
import MultiImageUpload from "../components/MultiImageUpload";
import type { ImageWithVerification } from "../components/MultiImageUpload";

type Feedback = { type: "success" | "error" | "warning"; message: string } | null;

const initialForm = {
  pet_name: "",
  pet_type: "",
  breed: "",
  gender: "",
  color: "",
  weight: "",
  vaccinated: "",
  age: "",
  city: "",
  state: "",
  pincode: "",
  description: "",
  location_url: "",
  lost_time: "",
};

export default function ReportLostPet() {
  
  useViewportStandardization();

  const [form, setForm] = useState(initialForm);
  const [photo, setPhoto] = useState<File | null>(null);
  const [additionalImages, setAdditionalImages] = useState<ImageWithVerification[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [toast, setToast] = useState<{
    isVisible: boolean;
    type: "success" | "error" | "warning";
    title: string;
    message: string;
  } | null>(null);
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState<string | null>(null);
  const [showFakeAlert, setShowFakeAlert] = useState(false);
  const [showPetTypeMismatchAlert, setShowPetTypeMismatchAlert] = useState(false);
  const navigate = useNavigate();

  
  const {
    verificationResult,
    isVerifying,
    verificationError,
    verifyImage,
    clearVerification,
  } = useImageVerification();

  
  const {
    verificationResult: petTypeResult,
    isVerifying: isPetTypeVerifying,
    verificationError: petTypeError,
    verifyPet,
    clearVerification: clearPetTypeVerification,
    hasShownMismatchAlert,
    markAlertShown,
  } = usePetTypeVerification();

  
  const {
    classificationResult: breedResult,
    isClassifying: isBreedClassifying,
    classificationError: breedError,
    classifyPetBreed,
    clearClassification: clearBreedClassification,
    shouldAutoFill,
  } = useBreedClassification();

  
  
  useEffect(() => {
    const mainPhotoIsFake = verificationResult && verificationResult.label === 'Fake';
    
    
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
    
    
    
    if (totalFakeCount > 0) {
      console.log('Fake images present, showing alert. Count:', totalFakeCount);
      setShowFakeAlert(true);
    } else {
      console.log('No fake images, hiding alert');
      setShowFakeAlert(false);
    }
  }, [verificationResult, additionalImages]);

  
  
  useEffect(() => {
    const imageIsReal = verificationResult && verificationResult.label === 'Real';
    const hasPetType = form.pet_type.trim().length > 0;
    
    if (photo && imageIsReal && hasPetType) {
      console.log('🔍 Running pet type verification:', form.pet_type);
      verifyPet(photo, form.pet_type);
    } else if (!hasPetType) {
      
      clearPetTypeVerification();
    }
  }, [photo, verificationResult, form.pet_type]);

  
  
  useEffect(() => {
    const petTypeVerified = petTypeResult && petTypeResult.status === 'verified';
    const hasBreed = form.breed.trim().length > 0;
    
    
    const supportedTypes = ['dog', 'horse', 'rabbit', 'bird'];
    const normalizedPetType = form.pet_type.toLowerCase().trim().replace(' ', '_');
    const isSupported = supportedTypes.includes(normalizedPetType);
    
    if (photo && petTypeVerified && isSupported) {
      console.log('🔍 Running breed classification:', form.pet_type, hasBreed ? `breed: ${form.breed}` : 'no breed');
      classifyPetBreed(photo, form.pet_type, hasBreed ? form.breed : undefined);
    } else if (!isSupported && form.pet_type.trim()) {
      
      clearBreedClassification();
    }
  }, [photo, petTypeResult, form.pet_type, form.breed]);

  
  useEffect(() => {
    if (shouldAutoFill && breedResult && breedResult.predicted_breed && !form.breed.trim()) {
      const formattedBreed = breedResult.predicted_breed.replace(/_/g, ' ');
      console.log('✨ Auto-filling breed:', formattedBreed);
      setForm(prev => ({ ...prev, breed: formattedBreed }));
    }
  }, [shouldAutoFill, breedResult, form.breed]);

  
  useEffect(() => {
    if (petTypeResult && petTypeResult.status === 'mismatch' && !hasShownMismatchAlert) {
      console.log('🚨 Pet type mismatch detected, showing alert');
      setShowPetTypeMismatchAlert(true);
      markAlertShown();
    }
  }, [petTypeResult, hasShownMismatchAlert, markAlertShown]);

  function handleChange(field: keyof typeof initialForm, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    
    
    if (field === 'pet_type') {
      clearPetTypeVerification();
      clearBreedClassification();
    }
    
    
    if (field === 'breed') {
      clearBreedClassification();
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
        enableHighAccuracy: false, 
        timeout: 30000, 
        maximumAge: 60000 
      },
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    
    if (!photo) {
      setToast({
        isVisible: true,
        type: "error",
        title: "Photo Required",
        message: "Please upload a photo of your pet."
      });
      return;
    }
    
    
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
    
    
    const res = await reportLostPet({
      ...form,
      location_url: form.location_url,
      photo,
    });
    
    if (res.ok) {
      
      if (additionalImages.length > 0 && res.data?.id) {
        const reportId = res.data.id;
        const additionalFiles = additionalImages.map(img => img.file);
        
        const { uploadLostPetPhotos } = await import('../services/api');
        const uploadRes = await uploadLostPetPhotos(reportId, additionalFiles);
        
        if (!uploadRes.ok) {
          console.error('Failed to upload additional photos:', uploadRes.error);
          
          setToast({
            isVisible: true,
            type: "warning",
            title: "Report Submitted",
            message: "Lost pet report submitted successfully, but some additional photos failed to upload. Awaiting admin approval."
          });
        } else {
          setToast({
            isVisible: true,
            type: "warning",
            title: "Report Submitted",
            message: "Lost pet report submitted successfully! Awaiting admin approval."
          });
        }
      } else {
        setToast({
          isVisible: true,
          type: "warning",
          title: "Report Submitted",
          message: "Lost pet report submitted successfully! Awaiting admin approval."
        });
      }
      
      
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
        background: "#f7f9fc",
        boxSizing: "border-box",
        fontFamily: "Inter, sans-serif",
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
      
      {}
      {}
      {showFakeAlert && (
        <FakeImageAlert
          show={showFakeAlert}
          onClose={() => {}} 
        />
      )}
      
      {}
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
          padding: 32,
          boxShadow: "0 18px 50px rgba(15,23,42,0.12)",
          border: "1px solid rgba(15,23,42,0.08)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
            marginBottom: 24,
          }}
        >
          <div>
            <div style={{ fontSize: 28, fontWeight: 800, color: "#0f172a" }}>
              Report Lost Pet
            </div>
            <p
              style={{
                margin: "6px 0 0",
                color: "rgba(15,23,42,0.65)",
                maxWidth: 600,
              }}
            >
              Provide as many details as you can so community members can help
              find your pet quickly.
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
              marginBottom: 18,
              padding: "12px 16px",
              borderRadius: 12,
              border: `1px solid ${
                feedback.type === "success"
                  ? "rgba(249,115,22,0.3)"
                  : "rgba(248,113,113,0.4)"
              }`,
              background:
                feedback.type === "success"
                  ? "rgba(249,115,22,0.12)"
                  : "rgba(248,113,113,0.12)",
              color: feedback.type === "success" ? "#c2410c" : "#b91c1c",
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
              <label style={labelStyle}>Pet Name</label>
              <input
                type="text"
                value={form.pet_name}
                onChange={(e) => handleChange("pet_name", e.target.value)}
                style={inputStyle}
                placeholder="Pet Name"
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
              
              {}
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
              <label style={labelStyle}>
                Breed<span style={{ color: "#f97316" }}> *</span>
              </label>
              <input
                type="text"
                required
                value={form.breed}
                onChange={(e) => handleChange("breed", e.target.value)}
                onBlur={() => {
                  
                  if (photo && petTypeResult?.status === 'verified' && form.breed.trim()) {
                    classifyPetBreed(photo, form.pet_type, form.breed);
                  }
                }}
                style={{
                  ...inputStyle,
                  borderColor: breedResult?.status === 'mismatch' 
                    ? '#ef4444'  
                    : breedResult?.status === 'verified'
                    ? '#22c55e'
                    : 'rgba(15,23,42,0.15)'
                }}
                placeholder="Breed"
              />
              
              {}
              {isBreedClassifying && (
                <div style={{ marginTop: 8, fontSize: 13, color: "#6b7280", display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ animation: 'spin 1s linear infinite' }}>🔍</span>
                  Classifying breed...
                </div>
              )}
              
              {breedError && (
                <div style={{ marginTop: 8, fontSize: 13, color: "#dc2626" }}>
                  ⚠️ {breedError}
                </div>
              )}
              
              {breedResult && breedResult.status === 'not_supported' && (
                <div style={{ marginTop: 8, fontSize: 12, color: "#6b7280", fontStyle: 'italic' }}>
                  ℹ️ Breed classification not available for {form.pet_type}
                </div>
              )}
              
              {breedResult && breedResult.status === 'auto_filled' && (
                <div style={{ 
                  marginTop: 8, 
                  fontSize: 13, 
                  color: "#2563eb",
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}>
                  ✨ {breedResult.message}
                  {breedResult.low_confidence && (
                    <span style={{ fontSize: 11, color: "#f59e0b", fontWeight: 400 }}>
                      ({breedResult.warning})
                    </span>
                  )}
                </div>
              )}
              
              {breedResult && breedResult.status === 'verified' && (
                <div style={{ 
                  marginTop: 8, 
                  fontSize: 13, 
                  color: "#16a34a",
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}>
                  ✅ {breedResult.message}
                  {breedResult.low_confidence && (
                    <div style={{ fontSize: 11, color: "#f59e0b", fontWeight: 400, marginTop: 2 }}>
                      {breedResult.warning}
                    </div>
                  )}
                </div>
              )}
              
              {breedResult && breedResult.status === 'mismatch' && (
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
                    ❌ {breedResult.message}
                  </div>
                  {breedResult.low_confidence && (
                    <div style={{ fontSize: 11, color: "#6b7280" }}>
                      {breedResult.warning}
                    </div>
                  )}
                </div>
              )}
            </div>
            <div>
              <label style={labelStyle}>
                Gender<span style={{ color: "#f97316" }}> *</span>
              </label>
              <select
                required
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
                placeholder="Color"
              />
            </div>
            <div>
              <label style={labelStyle}>Weight</label>
              <input
                type="text"
                value={form.weight}
                onChange={(e) => handleChange("weight", e.target.value)}
                style={inputStyle}
                placeholder="Weight (e.g., 5kg, Small, Medium)"
              />
            </div>
            <div>
              <label style={labelStyle}>Vaccinated</label>
              <select
                value={form.vaccinated}
                onChange={(e) => handleChange("vaccinated", e.target.value)}
                style={inputStyle}
              >
                <option value="">Select vaccination status</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
                <option value="Unknown">Unknown</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Age (years)</label>
              <input
                type="text"
                value={form.age}
                onChange={(e) => handleChange("age", e.target.value)}
                style={inputStyle}
                placeholder="Age"
              />
            </div>
            <div>
              <label style={labelStyle}>
                City<span style={{ color: "#f97316" }}> *</span>
              </label>
              <input
                type="text"
                required
                value={form.city}
                onChange={(e) => handleChange("city", e.target.value)}
                style={inputStyle}
                placeholder="Last seen city"
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
              onChange={(e) => handleChange("pincode", e.target.value)}
              style={inputStyle}
              placeholder="Postal/ZIP code"
            />
          </div>
          <div>
            <label style={labelStyle}>
              Lost Time<span style={{ color: "#f97316" }}> *</span>
            </label>
            <input
              type="datetime-local"
              required
              value={form.lost_time}
              onChange={(e) => handleChange("lost_time", e.target.value)}
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
              
              {}
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
          </div>

          {}
          <div>
            <label style={labelStyle}>
              Additional Images (Optional)
            </label>
            <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 12 }}>
              Upload up to 5 additional photos to help identify your pet. Each image will be verified for authenticity.
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
              Description (last seen location, behavior, etc.)
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
              placeholder="Share any details that can help"
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
                isBreedClassifying ||
                (petTypeResult?.status === 'mismatch') ||
                (breedResult?.status === 'mismatch')
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
                  isBreedClassifying ||
                  petTypeResult?.status === 'mismatch' ||
                  breedResult?.status === 'mismatch'
                )
                  ? "rgba(249,115,22,0.6)"
                  : "linear-gradient(90deg,#f97316,#ec4899)",
                color: "white",
                fontWeight: 700,
                cursor: (
                  submitting || 
                  verificationResult?.label === 'Fake' || 
                  additionalImages.some(img => img.verificationStatus === 'fake_detected') ||
                  additionalImages.some(img => img.verificationStatus === 'verifying') ||
                  isPetTypeVerifying ||
                  isBreedClassifying ||
                  petTypeResult?.status === 'mismatch' ||
                  breedResult?.status === 'mismatch'
                ) ? "not-allowed" : "pointer",
                boxShadow: "0 12px 34px rgba(249,115,22,0.35)",
                opacity: (
                  verificationResult?.label === 'Fake' || 
                  additionalImages.some(img => img.verificationStatus === 'fake_detected') ||
                  petTypeResult?.status === 'mismatch' ||
                  breedResult?.status === 'mismatch'
                ) ? 0.5 : 1,
              }}
            >
              {submitting 
                ? "Submitting..." 
                : isPetTypeVerifying
                  ? "Verifying Pet Type..."
                  : isBreedClassifying
                    ? "Classifying Breed..."
                    : additionalImages.some(img => img.verificationStatus === 'verifying')
                      ? "Verifying Images..."
                      : breedResult?.status === 'mismatch'
                        ? "Cannot Submit - Wrong Breed"
                        : petTypeResult?.status === 'mismatch'
                          ? "Cannot Submit - Wrong Pet Type"
                          : (verificationResult?.label === 'Fake' || additionalImages.some(img => img.verificationStatus === 'fake_detected'))
                            ? "Cannot Submit - Fake Image" 
                            : "Report Pet"}
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
