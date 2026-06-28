import { useEffect } from "react";


interface ExtendedCSSStyleDeclaration {
  webkitTextSizeAdjust?: string;
  msTextSizeAdjust?: string;
  textSizeAdjust?: string;
}


export const useViewportStandardization = () => {
  useEffect(() => {
    const standardizeViewport = () => {
      
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
    };

    
    standardizeViewport();

    
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        standardizeViewport();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  
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
