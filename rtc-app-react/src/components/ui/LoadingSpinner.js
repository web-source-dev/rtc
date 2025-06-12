import React from 'react';

/**
 * @param {Object} props
 * @param {boolean} props.fullScreen 
 * @param {string} props.message 
 * @param {string} props.className 
 */
const LoadingSpinner = ({ fullScreen = false, message = 'Loading...', className = '' }) => {
  if (fullScreen) {
    return (
      <div className="loading-overlay d-flex align-items-center justify-content-center">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          {message && <p className="mt-2 text-light">{message}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className={`d-flex align-items-center ${className}`}>
      <div className="spinner-border spinner-border-sm text-primary me-2" role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
      {message && <span>{message}</span>}
    </div>
  );
};

export default LoadingSpinner; 