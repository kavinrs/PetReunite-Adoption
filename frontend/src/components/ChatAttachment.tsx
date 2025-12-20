import React, { useRef, useState } from "react";

interface ChatAttachmentProps {
  onFileSelect: (file: File | null) => void;
  selectedFile: File | null;
  onClearFile: () => void;
  disabled?: boolean;
}

export function ChatAttachmentInput({
  onFileSelect,
  selectedFile,
  onClearFile,
  disabled = false,
}: ChatAttachmentProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    onFileSelect(file);
    // Reset input so same file can be selected again
    if (e.target) {
      e.target.value = "";
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const getFileIcon = (file: File): string => {
    const type = file.type;
    if (type.startsWith("image/")) return "🖼️";
    if (type.startsWith("video/")) return "🎥";
    if (type.includes("pdf")) return "📄";
    if (type.includes("word") || type.includes("document")) return "📝";
    if (type.includes("zip") || type.includes("rar") || type.includes("tar")) return "📦";
    return "📎";
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {/* File Input (Hidden) */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*,.pdf,.doc,.docx,.zip,.rar,.tar,.gz"
        style={{ display: "none" }}
        onChange={handleFileChange}
        disabled={disabled}
      />

      {/* Attach Button */}
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled}
        style={{
          border: "none",
          background: "transparent",
          cursor: disabled ? "not-allowed" : "pointer",
          padding: "6px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: disabled ? "#9ca3af" : "#6b7280",
          fontSize: 20,
          lineHeight: 1,
          opacity: disabled ? 0.5 : 1,
        }}
        aria-label="Attach file"
        title="Attach image, video, document, or folder"
      >
        📎
      </button>

      {/* Selected File Preview */}
      {selectedFile && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 12px",
            background: "#f3f4f6",
            borderRadius: 8,
            fontSize: 13,
          }}
        >
          <span style={{ fontSize: 18 }}>{getFileIcon(selectedFile)}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontWeight: 600,
                color: "#0f172a",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {selectedFile.name}
            </div>
            <div style={{ fontSize: 11, color: "#6b7280" }}>
              {formatFileSize(selectedFile.size)}
            </div>
          </div>
          <button
            type="button"
            onClick={onClearFile}
            style={{
              border: "none",
              background: "transparent",
              cursor: "pointer",
              padding: "4px",
              color: "#ef4444",
              fontSize: 18,
              lineHeight: 1,
            }}
            aria-label="Remove file"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}

interface MessageAttachmentDisplayProps {
  attachmentUrl: string;
  attachmentType: string;
  attachmentName: string;
  attachmentSize?: number;
}

export function MessageAttachmentDisplay({
  attachmentUrl,
  attachmentType,
  attachmentName,
  attachmentSize,
}: MessageAttachmentDisplayProps) {
  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return "";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  // Resolve relative URLs to absolute URLs using the API base
  const resolveUrl = (url: string): string => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    // Get API base from environment or default to localhost
    const apiBase = (import.meta as any).env?.VITE_API_BASE || 'http://localhost:8000';
    const origin = new URL(apiBase).origin;
    return origin + url;
  };

  const fullUrl = resolveUrl(attachmentUrl);

  if (attachmentType === "image") {
    return (
      <div style={{ marginTop: 8, maxWidth: 300 }}>
        <img
          src={fullUrl}
          alt={attachmentName}
          style={{
            width: "100%",
            borderRadius: 8,
            cursor: "pointer",
          }}
          onClick={() => window.open(fullUrl, "_blank")}
        />
        <div style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>
          {attachmentName}
        </div>
      </div>
    );
  }

  if (attachmentType === "video") {
    return (
      <div style={{ marginTop: 8, maxWidth: 400 }}>
        <video
          controls
          style={{
            width: "100%",
            borderRadius: 8,
          }}
        >
          <source src={fullUrl} />
          Your browser does not support the video tag.
        </video>
        <div style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>
          {attachmentName}
        </div>
      </div>
    );
  }

  // Document or folder - show download card
  const getIcon = () => {
    if (attachmentType === "folder") return "📦";
    if (attachmentName.includes(".pdf")) return "📄";
    if (attachmentName.includes(".doc")) return "📝";
    return "📎";
  };

  return (
    <a
      href={fullUrl}
      download={attachmentName}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 16px",
        background: "#f3f4f6",
        borderRadius: 8,
        marginTop: 8,
        textDecoration: "none",
        color: "#0f172a",
        border: "1px solid #e5e7eb",
        maxWidth: 300,
      }}
    >
      <span style={{ fontSize: 24 }}>{getIcon()}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontWeight: 600,
            fontSize: 13,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {attachmentName}
        </div>
        {attachmentSize && (
          <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>
            {formatFileSize(attachmentSize)}
          </div>
        )}
      </div>
      <span style={{ fontSize: 18, color: "#6b7280" }}>⬇</span>
    </a>
  );
}
