"use client";

import { useEffect } from "react";
import { AlertCircle, Home, RefreshCw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to console for debugging
    console.error("Global application error:", error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="min-h-screen bg-neutral-50 flex items-center justify-center px-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-large p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-6">
              <AlertCircle size={32} className="text-red-600" />
            </div>
            
            <h1 className="text-2xl font-bold text-neutral-900 mb-2">
              Application Error
            </h1>
            
            <p className="text-neutral-600 mb-6">
              A critical error occurred. Please refresh the page or contact support.
            </p>
            
            {error.digest && (
              <p className="text-xs text-neutral-400 mb-6 font-mono">
                Error ID: {error.digest}
              </p>
            )}
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={reset}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
              >
                <RefreshCw size={18} />
                Try Again
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}

