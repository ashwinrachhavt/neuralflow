"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    UnicornStudio: {
      isInitialized: boolean;
      init: () => void;
    };
  }
}

export function UnicornStudioBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const scriptLoadedRef = useRef(false);

  useEffect(() => {
    // Only load the script once
    if (scriptLoadedRef.current) return;
    scriptLoadedRef.current = true;

    // Check if UnicornStudio is already loaded
    if (window.UnicornStudio && window.UnicornStudio.isInitialized) {
      return;
    }

    // Initialize UnicornStudio if not already initialized
    if (!window.UnicornStudio) {
      window.UnicornStudio = { isInitialized: false, init: () => {} };
    }

    // Load the UnicornStudio script
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/gh/hiunicornstudio/unicornstudio.js@v1.4.29/dist/unicornStudio.umd.js";
    script.onload = function() {
      if (!window.UnicornStudio.isInitialized && window.UnicornStudio.init) {
        window.UnicornStudio.init();
        window.UnicornStudio.isInitialized = true;
      }
    };
    
    (document.head || document.body).appendChild(script);

    // Cleanup function
    return () => {
      // Don't remove the script as it might be used elsewhere
    };
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {/* UnicornStudio Animation Container */}
      <div 
        ref={containerRef}
        data-us-project="HMIeshgXg29QfOM5wLrX" 
        className="absolute inset-0 w-full h-full"
        style={{ 
          width: '100vw', 
          height: '100vh',
          minWidth: '100vw',
          minHeight: '100vh'
        }}
      />
      
      {/* Subtle overlay for better text readability without hiding the animation */}
      <div className="absolute inset-0 bg-black/10 pointer-events-none" />
    </div>
  );
}
