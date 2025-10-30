import { useState, useEffect } from 'react';
import './App.css';

interface ApiResponse {
  message: string;
  status?: string;
}

// Extend the ImportMeta interface to include Vite's env variables
declare global {
  interface ImportMeta {
    env: {
      VITE_API_URL?: string;
    };
  }
}

function App() {
  const [apiStatus, setApiStatus] = useState<string>('Checking API...');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const checkApi = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const response = await fetch(`${apiUrl}/api/health`);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: ApiResponse = await response.json();
        setApiStatus(data.message || 'API is running');
      } catch (error) {
        console.error('API connection error:', error);
        setApiStatus(`Error: ${error instanceof Error ? error.message : 'Failed to connect to API'}`);
      } finally {
        setIsLoading(false);
      }
    };

    checkApi();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-md p-8 text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Welcome to AccuBooks</h1>
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <div className="text-lg text-gray-600 mb-2">
                {apiStatus}
              </div>
              <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden mt-2">
                <div
                  className={`h-full ${apiStatus.includes('running') ? 'bg-green-500' : 'bg-red-500'} transition-all duration-500`}
                  style={{ width: apiStatus.includes('running') ? '100%' : '50%' }}>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-700">Getting Started</h2>
              <p className="text-gray-600">
                The AccuBooks application is now running in development mode.
              </p>
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 text-left">
                <p className="font-medium text-blue-700">Next Steps:</p>
                <ul className="list-disc list-inside mt-2 text-blue-600 space-y-1">
                  <li>Check the browser console for any errors</li>
                  <li>Review the API documentation for available endpoints</li>
                  <li>Start building your frontend components</li>
                </ul>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                Need help? Check out the documentation or contact support.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default App;
