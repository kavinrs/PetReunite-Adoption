import React, { useEffect, useState } from 'react';

interface FakeImageAlertProps {
  show: boolean;
  onClose: () => void;
}

const FakeImageAlert: React.FC<FakeImageAlertProps> = ({ show, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      // Auto-dismiss after 10 seconds
      const timer = setTimeout(() => {
        handleClose();
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [show]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300); // Wait for animation to complete
  };

  if (!show) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 16,
        left: '50%',
        transform: `translate(-50%, ${isVisible ? '0' : '-100%'})`,
        zIndex: 9999,
        maxWidth: '90%',
        width: 500,
        opacity: isVisible ? 1 : 0,
        transition: 'all 0.3s ease-out',
      }}
    >
      <div
        style={{
          backgroundColor: '#dc2626',
          color: 'white',
          borderRadius: 8,
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          overflow: 'hidden',
        }}
      >
        {/* Header with icon and close button */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: 16, paddingBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <div
              style={{
                flexShrink: 0,
                width: 40,
                height: 40,
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg
                style={{ width: 24, height: 24, color: 'white' }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4, margin: 0 }}>
                AI-Generated Image Detected
              </h3>
              <p style={{ fontSize: 14, color: '#fecaca', margin: 0 }}>
                The uploaded image appears to be artificially created or AI-generated.
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            style={{
              flexShrink: 0,
              background: 'none',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              padding: 4,
              marginLeft: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            aria-label="Close alert"
          >
            <svg style={{ width: 20, height: 20 }} fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>

        {/* Details */}
        <div style={{ padding: '0 16px 16px 16px' }}>
          <div style={{ fontSize: 14, color: '#fecaca' }}>
            <p style={{ fontWeight: 600, margin: '0 0 8px 0' }}>⚠️ Important:</p>
            <ul style={{ margin: 0, paddingLeft: 24, listStyleType: 'disc' }}>
              <li style={{ marginBottom: 4 }}>Please upload a genuine photograph of your pet</li>
              <li style={{ marginBottom: 4 }}>AI-generated images are not accepted</li>
              <li style={{ marginBottom: 4, fontWeight: 700, fontSize: 15 }}>You cannot submit this report with a fake image</li>
            </ul>
          </div>
        </div>

        {/* Progress bar for auto-dismiss */}
        <div style={{ height: 4, backgroundColor: '#991b1b' }}>
          <div
            style={{
              height: '100%',
              backgroundColor: 'white',
              width: isVisible ? '0%' : '100%',
              transition: 'width 10000ms linear',
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default FakeImageAlert;
