import React, { useEffect, useState } from 'react';

interface FakeImageAlertProps {
  show: boolean;
  onClose: () => void;
}

const FakeImageAlert: React.FC<FakeImageAlertProps> = ({ show }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [cycleCount, setCycleCount] = useState(0);

  useEffect(() => {
    if (!show) {
      setIsVisible(false);
      setCycleCount(0);
      return;
    }

    // Start a new cycle
    const runCycle = () => {
      console.log('🔄 Starting alert cycle', cycleCount + 1);
      
      // Show alert
      setIsVisible(true);
      
      // Hide after 10 seconds
      const hideTimer = setTimeout(() => {
        console.log('⬆️ Hiding alert');
        setIsVisible(false);
      }, 10000);
      
      // Start next cycle after 12 seconds (10s visible + 2s hidden)
      const nextCycleTimer = setTimeout(() => {
        if (show) {
          console.log('🔁 Preparing next cycle');
          setCycleCount(prev => prev + 1);
        }
      }, 12000);
      
      return () => {
        clearTimeout(hideTimer);
        clearTimeout(nextCycleTimer);
      };
    };

    const cleanup = runCycle();
    return cleanup;
  }, [show, cycleCount]);

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
        {/* Header with icon */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: 16, paddingBottom: 12 }}>
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

        {/* Details */}
        <div style={{ padding: '0 16px 16px 16px' }}>
          <div style={{ fontSize: 14, color: '#fecaca' }}>
            <p style={{ fontWeight: 600, margin: '0 0 8px 0' }}>⚠️ Important:</p>
            <ul style={{ margin: 0, paddingLeft: 24, listStyleType: 'disc' }}>
              <li style={{ marginBottom: 4 }}>Please upload a genuine photograph of your pet</li>
              <li style={{ marginBottom: 4 }}>AI-generated images are not accepted</li>
              <li style={{ marginBottom: 4, fontWeight: 700, fontSize: 15 }}>You cannot submit this report with a fake image</li>
              <li style={{ marginBottom: 0, fontWeight: 600, fontSize: 14, color: '#fff' }}>Remove all fake images to stop this alert</li>
            </ul>
          </div>
        </div>

        {/* Progress bar - key prop forces restart */}
        <div style={{ height: 4, backgroundColor: '#991b1b' }}>
          <div
            key={cycleCount} // Force restart animation on each cycle
            style={{
              height: '100%',
              backgroundColor: 'white',
              width: '100%',
              animation: isVisible ? 'progressBar 10s linear forwards' : 'none',
            }}
          />
        </div>
      </div>
      
      {/* CSS Animation */}
      <style>{`
        @keyframes progressBar {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
      `}</style>
    </div>
  );
};

export default FakeImageAlert;
