'use client';

import React, { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class FirebaseErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Firebase Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError && this.state.error) {
      // Check if it's a Firebase error
      if (this.state.error.message?.includes('Firebase') || 
          this.state.error.message?.includes('firestore')) {
        return (
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
              <h2 className="text-2xl font-bold text-red-600 mb-4">Database Connection Error</h2>
              <p className="text-gray-700 mb-4">
                We're having trouble connecting to the database. This might be due to:
              </p>
              <ul className="list-disc list-inside text-gray-600 mb-4">
                <li>Network connectivity issues</li>
                <li>Firebase configuration problems</li>
                <li>Security rules restrictions</li>
              </ul>
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
              >
                Retry Connection
              </button>
            </div>
          </div>
        );
      }
    }

    return this.props.children;
  }
}

export default FirebaseErrorBoundary;