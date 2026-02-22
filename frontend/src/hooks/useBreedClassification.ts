import { useState, useCallback } from 'react';
import { classifyBreed } from '../services/api';

export interface BreedClassificationResult {
  predicted_breed: string | null;
  confidence: number;
  is_supported: boolean;
  low_confidence: boolean;
  user_breed: string | null;
  is_match: boolean | null;
  status: 'verified' | 'mismatch' | 'auto_filled' | 'not_supported' | 'model_unavailable' | 'error';
  message: string;
  warning?: string;
  all_predictions?: Array<{ breed: string; confidence: number }>;
}

export interface UseBreedClassificationReturn {
  classificationResult: BreedClassificationResult | null;
  isClassifying: boolean;
  classificationError: string | null;
  classifyPetBreed: (file: File, petType: string, userBreed?: string) => Promise<void>;
  clearClassification: () => void;
  shouldAutoFill: boolean;
}

export function useBreedClassification(): UseBreedClassificationReturn {
  const [classificationResult, setClassificationResult] = useState<BreedClassificationResult | null>(null);
  const [isClassifying, setIsClassifying] = useState(false);
  const [classificationError, setClassificationError] = useState<string | null>(null);
  const [shouldAutoFill, setShouldAutoFill] = useState(false);

  const classifyPetBreed = useCallback(async (file: File, petType: string, userBreed?: string) => {
    // Don't classify if pet type is empty
    if (!petType.trim()) {
      setClassificationResult(null);
      setClassificationError(null);
      setShouldAutoFill(false);
      return;
    }

    setIsClassifying(true);
    setClassificationError(null);
    setShouldAutoFill(false);

    try {
      const response = await classifyBreed(file, petType, userBreed);

      if (response.ok && response.data) {
        const result = response.data as BreedClassificationResult;
        setClassificationResult(result);
        
        // Set auto-fill flag if breed was auto-filled
        if (result.status === 'auto_filled' && result.predicted_breed) {
          setShouldAutoFill(true);
        }
      } else {
        setClassificationError(response.error || 'Failed to classify breed');
        setClassificationResult(null);
      }
    } catch (error) {
      console.error('Breed classification error:', error);
      setClassificationError('An error occurred while classifying breed');
      setClassificationResult(null);
    } finally {
      setIsClassifying(false);
    }
  }, []);

  const clearClassification = useCallback(() => {
    setClassificationResult(null);
    setClassificationError(null);
    setShouldAutoFill(false);
  }, []);

  return {
    classificationResult,
    isClassifying,
    classificationError,
    classifyPetBreed,
    clearClassification,
    shouldAutoFill,
  };
}
