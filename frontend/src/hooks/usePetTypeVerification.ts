import { useState, useCallback } from 'react';
import { verifyPetType } from '../services/api';

export interface PetTypeVerificationResult {
  detected_type: string | null;
  confidence: number;
  user_input: string;
  is_match: boolean;
  status: 'verified' | 'mismatch' | 'uncertain' | 'no_detection';
  message: string;
  suggestion?: string;
  warning?: string;
}

export interface UsePetTypeVerificationReturn {
  verificationResult: PetTypeVerificationResult | null;
  isVerifying: boolean;
  verificationError: string | null;
  verifyPet: (file: File, petType: string) => Promise<void>;
  clearVerification: () => void;
  hasShownMismatchAlert: boolean;
  markAlertShown: () => void;
}

export function usePetTypeVerification(): UsePetTypeVerificationReturn {
  const [verificationResult, setVerificationResult] = useState<PetTypeVerificationResult | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [hasShownMismatchAlert, setHasShownMismatchAlert] = useState(false);

  const verifyPet = useCallback(async (file: File, petType: string) => {
    // Don't verify if pet type is empty
    if (!petType.trim()) {
      setVerificationResult(null);
      setVerificationError(null);
      return;
    }

    setIsVerifying(true);
    setVerificationError(null);

    try {
      const response = await verifyPetType(file, petType);

      if (response.ok && response.data) {
        const result = response.data as PetTypeVerificationResult;
        setVerificationResult(result);
        
        // Mark that we need to show alert if there's a mismatch
        if (result.status === 'mismatch' && !hasShownMismatchAlert) {
          // Alert will be shown by the component
        }
      } else {
        setVerificationError(response.error || 'Failed to verify pet type');
        setVerificationResult(null);
      }
    } catch (error) {
      console.error('Pet type verification error:', error);
      setVerificationError('An error occurred while verifying pet type');
      setVerificationResult(null);
    } finally {
      setIsVerifying(false);
    }
  }, [hasShownMismatchAlert]);

  const clearVerification = useCallback(() => {
    setVerificationResult(null);
    setVerificationError(null);
    setHasShownMismatchAlert(false);
  }, []);

  const markAlertShown = useCallback(() => {
    setHasShownMismatchAlert(true);
  }, []);

  return {
    verificationResult,
    isVerifying,
    verificationError,
    verifyPet,
    clearVerification,
    hasShownMismatchAlert,
    markAlertShown,
  };
}
