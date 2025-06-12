import React from 'react';

/**

 * @param {Object} props
 * @param {Object|string} props.error 
 * @param {Function} props.onDismiss 
 * @param {Function} props.onRetry 
 * @param {string} props.className 
 */
const ErrorMessage = ({ error, onDismiss, onRetry, className = '' }) => {
  const errorMessage = typeof error === 'string' 
    ? error 
    : (error?.message || 'An unexpected error occurred');

  return (
    <div className={`alert alert-danger ${className}`} role="alert">
      <div className="d-flex justify-content-between">
        <div>
          <h5 className="alert-heading">Error</h5>
          <p className="mb-0">{errorMessage}</p>
        </div>
        <div>
          {onDismiss && (
            <button 
              type="button" 
              className="btn-close" 
              aria-label="Close" 
              onClick={onDismiss}
            />
          )}
        </div>
      </div>
      
      {onRetry && (
        <div className="mt-3">
          <button 
            type="button" 
            className="btn btn-sm btn-outline-danger" 
            onClick={onRetry}
          >
            Retry
          </button>
        </div>
      )}
    </div>
  );
};

export default ErrorMessage; 