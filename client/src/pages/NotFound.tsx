import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui';

const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md mx-auto text-center">
        <div className="mb-8">
          <h1 className="text-6xl font-bold text-gray-900">404</h1>
          <h2 className="mt-4 text-3xl font-bold text-gray-900">Page Not Found</h2>
          <p className="mt-2 text-gray-600">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>
        
        <div className="space-y-4">
          <Link to="/dashboard">
            <Button className="w-full">
              Go to Dashboard
            </Button>
          </Link>
          <Link to="/">
            <Button variant="outline" className="w-full">
              Go Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;