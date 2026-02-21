import React from 'react';

interface ImageVerificationBadgeProps {
  label: 'Real' | 'Fake' | 'Uncertain';
  confidence: number;
  warning?: string;
}

const ImageVerificationBadge: React.FC<ImageVerificationBadgeProps> = ({
  label,
  confidence,
  warning,
}) => {
  // Determine badge style and professional message based on label
  const getBadgeConfig = () => {
    switch (label) {
      case 'Real':
        return {
          bgColor: '#f0fdf4',
          borderColor: '#86efac',
          textColor: '#166534',
          icon: '✓',
          message: 'Image is authentic',
          description: 'This appears to be a genuine photograph',
        };
      case 'Fake':
        return {
          bgColor: '#fef2f2',
          borderColor: '#fca5a5',
          textColor: '#991b1b',
          icon: '✗',
          message: 'Image is AI-generated',
          description: 'This image appears to be artificially created',
        };
      case 'Uncertain':
        return {
          bgColor: '#fffbeb',
          borderColor: '#fcd34d',
          textColor: '#92400e',
          icon: '⚠',
          message: 'Image verification uncertain',
          description: 'Unable to determine image authenticity',
        };
      default:
        return {
          bgColor: '#f9fafb',
          borderColor: '#d1d5db',
          textColor: '#374151',
          icon: '?',
          message: 'Unknown status',
          description: '',
        };
    }
  };

  const config = getBadgeConfig();
  const confidencePercent = Math.round(confidence * 100);

  return (
    <div style={{ marginTop: 12 }}>
      {/* Compact Badge */}
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 12px',
          borderRadius: 8,
          border: `1px solid ${config.borderColor}`,
          backgroundColor: config.bgColor,
        }}
      >
        <span style={{ fontSize: 16, fontWeight: 700, color: config.textColor }}>
          {config.icon}
        </span>
        <span style={{ fontSize: 14, fontWeight: 600, color: config.textColor }}>
          {config.message}
        </span>
      </div>

      {/* Warning message for fake/uncertain - shown below badge */}
      {warning && label !== 'Real' && (
        <div
          style={{
            marginTop: 8,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 8,
            padding: 12,
            borderRadius: 8,
            backgroundColor: label === 'Fake' ? '#fef2f2' : '#fffbeb',
            border: label === 'Fake' ? '1px solid #fecaca' : '1px solid #fde68a',
          }}
        >
          <span
            style={{
              fontSize: 14,
              marginTop: 2,
              color: label === 'Fake' ? '#dc2626' : '#d97706',
            }}
          >
            {label === 'Fake' ? '✗' : '⚠'}
          </span>
          <p
            style={{
              fontSize: 14,
              margin: 0,
              color: label === 'Fake' ? '#991b1b' : '#92400e',
            }}
          >
            {warning}
          </p>
        </div>
      )}
    </div>
  );
};

export default ImageVerificationBadge;
