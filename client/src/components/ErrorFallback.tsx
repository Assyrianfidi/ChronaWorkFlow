import React from "react";

const ErrorFallback = () => (
  <div className="p-8 text-center">
    <h1 className="text-xl font-bold mb-4">Something went wrong</h1>
    <p>Please try refreshing the page or contact support.</p>
    <button
      className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
      onClick={() => window.location.reload()}
    >
      Refresh Page
    </button>
  </div>
);

export default ErrorFallback;
