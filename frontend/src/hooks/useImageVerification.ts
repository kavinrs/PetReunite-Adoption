import { useState } from 'react';
import { checkImageAuthenticity } from '../services/api';

export interface ImageVerificationResult {
  label: 'Real' | 'Fake' | 'Uncertain';
  confidence: number;
  raw_score: number;
  status: 'verified' | 'fake_detected' | 'uncertain';
  warning?: string;
}

export interface UseImageVerificationReturn {
  verificationResult: ImageVerificationResult | null;
  isVerifying: boolean;
  verificationError: string | null;
  verifyImage: (file: File) => Promise<void>;
  clearVerification: () => void;
}

export function useImageVerification(): UseImageVerificationReturn {
  const [verificationResult, setVerificationResult] = useState<ImageVerificationResult | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);

  const verifyImage = async (file: File) => {
    setIsVerifying(true);
    setVerificationError(null);
    setVerificationResult(null);

    try {
      const response = await checkImageAuthenticity(file);

      if (response.ok && response.data) {
        setVerificationResult(response.data as ImageVerificationResult);
      } else {
        setVerificationError(response.error || 'Failed to verify image authenticity');
      }
    } catch (error) {
      console.error('Image verification error:', error);
      setVerificationError('An error occurred while verifying the image');
    } finally {
      setIsVerifying(false);
    }
  };

  const clearVerification = () => {
    setVerificationResult(null);
    setVerificationError(null);
  };

  return {
    verificationResult,
    isVerifying,
    verificationError,
    verifyImage,
    clearVerification,
  };
}
