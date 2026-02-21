import React, { useState, useRef } from 'react';
import { checkImageAuthenticity } from '../services/api';

export interface ImageWithVerification {
  file: File;
  preview: string;
  verificationStatus: 'not_checked' | 'verified' | 'fake_detected' | 'uncertain' | 'verifying';
  verificationLabel?: 'Real' | 'Fake' | 'Uncertain';
  confidence?: number;
  rawScore?: number;
  error?: string;
}

interface MultiImageUploadProps {
  images: ImageWithVerification[];
  onImagesChange: (images: ImageWithVerification[]) => void;
  maxImages?: number;
  disabled?: boolean;
}

export default function MultiImageUpload({
  images,
  onImagesChange,
  maxImages = 5,
  disabled = false,
}: MultiImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const verifyImage = async (file: File): Promise<Partial<ImageWithVerification>> => {
    console.log('🔍 Starting verification for:', file.name);
    try {
      const result = await checkImageAuthenticity(file);
      console.log('📊 Verification result for', file.name, ':', result);
      
      if (!result.ok || !result.data) {
        console.log('❌ Verification failed for', file.name);
        return {
          verificationStatus: 'uncertain',
          error: 'Verification failed',
        };
      }

      const { label, confidence, raw_score } = result.data;
      console.log('✅ Verification complete for', file.name, '- Label:', label, 'Confidence:', confidence);
      
      let status: ImageWithVerification['verificationStatus'];
      if (label === 'Real') {
        status = 'verified';
      } else if (label === 'Fake') {
        status = 'fake_detected';
        console.log('🚨 FAKE IMAGE DETECTED:', file.name);
      } else {
        status = 'uncertain';
      }

      return {
        verificationStatus: status,
        verificationLabel: label,
        confidence,
        rawScore: raw_score,
      };
    } catch (error) {
      console.error('❌ Image verification error for', file.name, ':', error);
      return {
        verificationStatus: 'uncertain',
        error: 'Verification error',
      };
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setUploadError(null);

    if (files.length === 0) return;

    // Check if adding these files would exceed the limit
    if (images.length + files.length > maxImages) {
      setUploadError(`You can only upload up to ${maxImages} images`);
      return;
    }

    // Create preview URLs and add to images array with "verifying" status
    const newImages: ImageWithVerification[] = files.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      verificationStatus: 'verifying',
    }));

    // Add images immediately with "verifying" status
    const updatedImages = [...images, ...newImages];
    onImagesChange(updatedImages);

    // Verify each image in parallel
    const verificationPromises = newImages.map(async (img, index) => {
      const verification = await verifyImage(img.file);
      return { index: images.length + index, verification };
    });

    const results = await Promise.all(verificationPromises);

    // Update images with verification results
    const finalImages = [...updatedImages];
    results.forEach(({ index, verification }) => {
      console.log('📝 Updating image at index', index, 'with verification:', verification);
      finalImages[index] = {
        ...finalImages[index],
        ...verification,
      };
    });

    console.log('✨ Final images state:', finalImages.map(img => ({
      name: img.file.name,
      status: img.verificationStatus,
      label: img.verificationLabel
    })));

    onImagesChange(finalImages);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    // Revoke the object URL to free memory
    URL.revokeObjectURL(images[index].preview);
    onImagesChange(newImages);
  };

  const getStatusBadge = (image: ImageWithVerification) => {
    if (image.verificationStatus === 'verifying') {
      return (
        <div style={{
          position: 'absolute',
          top: 8,
          right: 8,
          background: 'rgba(59, 130, 246, 0.95)',
          color: 'white',
          padding: '4px 8px',
          borderRadius: 6,
          fontSize: 11,
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: 4,
        }}>
          <span style={{ animation: 'spin 1s linear infinite' }}>🔍</span>
          Verifying...
        </div>
      );
    }

    if (image.verificationStatus === 'verified') {
      return (
        <div style={{
          position: 'absolute',
          top: 8,
          right: 8,
          background: 'rgba(34, 197, 94, 0.95)',
          color: 'white',
          padding: '4px 8px',
          borderRadius: 6,
          fontSize: 11,
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: 4,
        }}>
          ✓ Verified
        </div>
      );
    }

    if (image.verificationStatus === 'fake_detected') {
      return (
        <div style={{
          position: 'absolute',
          top: 8,
          right: 8,
          background: 'rgba(239, 68, 68, 0.95)',
          color: 'white',
          padding: '4px 8px',
          borderRadius: 6,
          fontSize: 11,
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: 4,
        }}>
          ✗ Fake Image
        </div>
      );
    }

    if (image.verificationStatus === 'uncertain') {
      return (
        <div style={{
          position: 'absolute',
          top: 8,
          right: 8,
          background: 'rgba(234, 179, 8, 0.95)',
          color: 'white',
          padding: '4px 8px',
          borderRadius: 6,
          fontSize: 11,
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: 4,
        }}>
          ⚠ Uncertain
        </div>
      );
    }

    return null;
  };

  const hasFakeImage = images.some(img => img.verificationStatus === 'fake_detected');
  const isVerifying = images.some(img => img.verificationStatus === 'verifying');

  return (
    <div>
      {/* Upload Button */}
      {images.length < maxImages && (
        <div style={{ marginBottom: 16 }}>
          <label style={{
            display: 'inline-block',
            padding: '10px 20px',
            borderRadius: 8,
            background: disabled ? '#e5e7eb' : '#374151',
            color: disabled ? '#9ca3af' : '#fff',
            fontSize: 14,
            fontWeight: 600,
            cursor: disabled ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s',
          }}>
            + Add Images ({images.length}/{maxImages})
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              disabled={disabled}
              style={{ display: 'none' }}
            />
          </label>
          <div style={{ marginTop: 6, fontSize: 12, color: '#6b7280' }}>
            You can upload up to {maxImages} images. Each will be verified for authenticity.
          </div>
        </div>
      )}

      {/* Upload Error */}
      {uploadError && (
        <div style={{
          marginBottom: 16,
          padding: '10px 14px',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: 8,
          color: '#dc2626',
          fontSize: 13,
          fontWeight: 500,
        }}>
          {uploadError}
        </div>
      )}

      {/* Fake Image Warning */}
      {hasFakeImage && (
        <div style={{
          marginBottom: 16,
          padding: '12px 16px',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: 8,
          color: '#dc2626',
          fontSize: 14,
          fontWeight: 600,
        }}>
          ⚠️ One or more images are detected as AI-generated. Please remove fake images before submitting.
        </div>
      )}

      {/* Verifying Status */}
      {isVerifying && (
        <div style={{
          marginBottom: 16,
          padding: '10px 14px',
          background: 'rgba(59, 130, 246, 0.1)',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          borderRadius: 8,
          color: '#2563eb',
          fontSize: 13,
          fontWeight: 500,
        }}>
          🔍 Verifying images...
        </div>
      )}

      {/* Image Grid - All 5 images in one horizontal row with fixed size */}
      {images.length > 0 && (
        <div 
          style={{
            display: 'flex',
            gap: 12,
            flexWrap: 'nowrap',
            justifyContent: 'flex-start',
            maxWidth: '100%',
          }}>
          {images.map((image, index) => (
            <div
              key={index}
              style={{
                position: 'relative',
                width: 150,
                height: 150,
                flexShrink: 0,
                borderRadius: 12,
                overflow: 'hidden',
                border: image.verificationStatus === 'fake_detected' 
                  ? '2px solid #ef4444' 
                  : '1px solid #e5e7eb',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              }}
            >
              {/* Image Preview */}
              <img
                src={image.preview}
                alt={`Upload ${index + 1}`}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />

              {/* Verification Badge */}
              {getStatusBadge(image)}

              {/* Remove Button */}
              <button
                type="button"
                onClick={() => handleRemoveImage(index)}
                style={{
                  position: 'absolute',
                  bottom: 8,
                  right: 8,
                  background: 'rgba(0, 0, 0, 0.7)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 6,
                  width: 28,
                  height: 28,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: 16,
                  fontWeight: 'bold',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.9)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(0, 0, 0, 0.7)';
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Styles for animations */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
