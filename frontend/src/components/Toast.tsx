import React, { useEffect, useState } from "react";

interface ToastProps {
  type: "success" | "error";
  title: string;
  message: string;
  isVisible: boolean;
  onClose: () => void;
  autoCloseMs?: number;
}

export default function Toast({
  type,
  title,
  message,
  isVisible,
  onClose,
  autoCloseMs = 4000,
}: ToastProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true);
      const timer = setTimeout(() => {
        handleClose();
      }, autoCloseMs);
      return () => clearTimeout(timer);
    }
  }, [isVisible, autoCloseMs]);

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(() => {
      onClose();
    }, 300); // Wait for fade out animation
  };

  if (!isVisible) return null;

  const isSuccess = type === "success";

  return (
    <div
      role="alert"
      aria-live="polite"
      style={{
        position: "fixed",
        top: 24,
        left: "50%",
        transform: isAnimating 
          ? "translateX(-50%) translateY(0)" 
          : "translateX(-50%) translateY(-100%)",
        opacity: isAnimating ? 1 : 0,
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        zIndex: 10000,
        maxWidth: 400,
        minWidth: 320,
      }}
    >
      <div
        style={{
          background: "#ffffff",
          borderRadius: 16,
          padding: 16,
          boxShadow: "0 20px 50px rgba(15, 23, 42, 0.15)",
          border: `1px solid ${isSuccess ? "#d1fae5" : "#fee2e2"}`,
          display: "flex",
          alignItems: "flex-start",
          gap: 12,
        }}
      >
        {/* Icon */}
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            background: isSuccess
              ? "linear-gradient(135deg, #10b981, #059669)"
              : "linear-gradient(135deg, #ef4444, #dc2626)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: 18, color: "white" }}>
            {isSuccess ? "✓" : "✕"}
          </span>
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: "#111827",
              marginBottom: 4,
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontSize: 13,
              color: "#6b7280",
              lineHeight: 1.5,
            }}
          >
            {message}
          </div>
        </div>

        {/* Close button */}
        <button
          type="button"
          onClick={handleClose}
          style={{
            border: "none",
            background: "transparent",
            cursor: "pointer",
            color: "#9ca3af",
            fontSize: 18,
            padding: 4,
            lineHeight: 1,
            flexShrink: 0,
          }}
          aria-label="Close notification"
        >
          ×
        </button>
      </div>

      {/* Progress bar */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 3,
          background: isSuccess ? "#d1fae5" : "#fee2e2",
          borderRadius: "0 0 16px 16px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            background: isSuccess ? "#10b981" : "#ef4444",
            animation: `toast-progress ${autoCloseMs}ms linear`,
            transformOrigin: "left",
          }}
        />
      </div>

      <style>
        {`
          @keyframes toast-progress {
            from { transform: scaleX(1); }
            to { transform: scaleX(0); }
          }
        `}
      </style>
    </div>
  );
}