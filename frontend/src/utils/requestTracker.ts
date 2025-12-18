// Utility functions for tracking sent pet requests

interface SentRequest {
  timestamp: number;
  petName: string;
}

const STORAGE_KEY = "sentPetRequests";

export function markRequestAsSent(petUniqueId: string, petName: string): void {
  const sentRequests = getSentRequests();
  sentRequests[petUniqueId] = {
    timestamp: Date.now(),
    petName,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sentRequests));
}

export function isRequestSent(petUniqueId: string): boolean {
  const sentRequests = getSentRequests();
  return !!sentRequests[petUniqueId];
}

export function getSentRequests(): Record<string, SentRequest> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

export function clearSentRequest(petUniqueId: string): void {
  const sentRequests = getSentRequests();
  delete sentRequests[petUniqueId];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sentRequests));
}

// Optional: Clean up old requests (older than 30 days)
export function cleanupOldRequests(): void {
  const sentRequests = getSentRequests();
  const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
  
  let hasChanges = false;
  for (const [petId, request] of Object.entries(sentRequests)) {
    if (request.timestamp < thirtyDaysAgo) {
      delete sentRequests[petId];
      hasChanges = true;
    }
  }
  
  if (hasChanges) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sentRequests));
  }
}