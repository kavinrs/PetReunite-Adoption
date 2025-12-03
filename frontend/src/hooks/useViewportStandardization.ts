import { useEffect } from "react";

// Interface for browser-specific CSS properties
interface ExtendedCSSStyleDeclaration {
  webkitTextSizeAdjust?: string;
  msTextSizeAdjust?: string;
  textSizeAdjust?: string;
}

/**
 * Custom hook to ensure consistent viewport behavior across all pages
 * This prevents inconsistent scaling while allowing natural website sizing
 * and maintains standard web viewing experience
 */
export const useViewportStandardization = () => {
  useEffect(() => {
    const standardizeViewport = () => {
      // Prevent text size adjustment that can cause scaling inconsistencies
      const bodyStyle = document.body.style as CSSStyleDeclaration &
        ExtendedCSSStyleDeclaration;
      bodyStyle.webkitTextSizeAdjust = "100%";
      bodyStyle.msTextSizeAdjust = "100%";
      bodyStyle.textSizeAdjust = "100%";

      // Ensure consistent viewport meta tag
      const viewportMeta = document.querySelector('meta[name="viewport"]');
      if (viewportMeta) {
        viewportMeta.setAttribute(
          "content",
          "width=device-width, initial-scale=1.0, user-scalable=yes",
        );
      }
    };

    // Apply immediately
    standardizeViewport();

    // Handle page visibility changes (when user returns to tab)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        standardizeViewport();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Cleanup function
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  // Return utility function for manual standardization if needed
  return {
    standardizeViewport: () => {
      const bodyStyle = document.body.style as CSSStyleDeclaration &
        ExtendedCSSStyleDeclaration;
      bodyStyle.webkitTextSizeAdjust = "100%";
      bodyStyle.msTextSizeAdjust = "100%";
      bodyStyle.textSizeAdjust = "100%";

      const viewportMeta = document.querySelector('meta[name="viewport"]');
      if (viewportMeta) {
        viewportMeta.setAttribute(
          "content",
          "width=device-width, initial-scale=1.0, user-scalable=yes",
        );
      }
    },
  };
};

export default useViewportStandardization;
