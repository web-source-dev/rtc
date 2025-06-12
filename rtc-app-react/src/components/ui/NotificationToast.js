import React, { useState, useEffect } from 'react';
import '../../../src/styles/NotificationToast.css';

const NotificationToast = ({ notification, onDismiss }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [progressStyle, setProgressStyle] = useState({});
  
  useEffect(() => {
    const timeout = notification.timeout || 5000;
    
    if (timeout) {
      setProgressStyle({
        '--progress-duration': `${timeout}ms`
      });
      
      const timer = setTimeout(() => {
        handleClose();
      }, timeout);
      
      return () => clearTimeout(timer);
    }
  }, [notification]);
  
  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onDismiss(notification.id);
    }, 400);
  };
  
  const getTypeClass = () => notification.type || 'info';
  
  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" fill="currentColor" fillOpacity="0.08"/>
            <path d="M16.0303 8.96967C16.3232 9.26256 16.3232 9.73744 16.0303 10.0303L11.0303 15.0303C10.7374 15.3232 10.2626 15.3232 9.96967 15.0303L7.96967 13.0303C7.67678 12.7374 7.67678 12.2626 7.96967 11.9697C8.26256 11.6768 8.73744 11.6768 9.03033 11.9697L10.5 13.4393L14.9697 8.96967C15.2626 8.67678 15.7374 8.67678 16.0303 8.96967Z" fill="currentColor" stroke="currentColor" strokeWidth="0.5"/>
          </svg>
        );
      case 'error':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" fill="currentColor" fillOpacity="0.08"/>
            <path d="M15.5303 8.46967C15.8232 8.76256 15.8232 9.23744 15.5303 9.53033L13.0607 12L15.5303 14.4697C15.8232 14.7626 15.8232 15.2374 15.5303 15.5303C15.2374 15.8232 14.7626 15.8232 14.4697 15.5303L12 13.0607L9.53033 15.5303C9.23744 15.8232 8.76256 15.8232 8.46967 15.5303C8.17678 15.2374 8.17678 14.7626 8.46967 14.4697L10.9393 12L8.46967 9.53033C8.17678 9.23744 8.17678 8.76256 8.46967 8.46967C8.76256 8.17678 9.23744 8.17678 9.53033 8.46967L12 10.9393L14.4697 8.46967C14.7626 8.17678 15.2374 8.17678 15.5303 8.46967Z" fill="currentColor" stroke="currentColor" strokeWidth="0.5"/>
          </svg>
        );
      case 'warning':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M10.2815 4.81058C10.991 3.59554 12.7752 3.5728 13.5159 4.76728L21.3131 17.1459C22.0971 18.4051 21.1192 19.9999 19.6256 19.9999H4.46698C2.99518 19.9999 2.00551 18.444 2.75281 17.1826L10.2815 4.81058Z" fill="currentColor" fillOpacity="0.08"/>
            <path d="M12 8C12.5523 8 13 8.44772 13 9V13C13 13.5523 12.5523 14 12 14C11.4477 14 11 13.5523 11 13V9C11 8.44772 11.4477 8 12 8Z" fill="currentColor" stroke="currentColor" strokeWidth="0.5"/>
            <path d="M12 16C12.5523 16 13 16.4477 13 17C13 17.5523 12.5523 18 12 18C11.4477 18 11 17.5523 11 17C11 16.4477 11.4477 16 12 16Z" fill="currentColor" stroke="currentColor" strokeWidth="0.5"/>
          </svg>
        );
      default:
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" fill="currentColor" fillOpacity="0.08"/>
            <path d="M12 7C12.5523 7 13 6.55228 13 6C13 5.44772 12.5523 5 12 5C11.4477 5 11 5.44772 11 6C11 6.55228 11.4477 7 12 7Z" fill="currentColor" stroke="currentColor" strokeWidth="0.5"/>
            <path d="M12 10C12.5523 10 13 10.4477 13 11V17C13 17.5523 12.5523 18 12 18C11.4477 18 11 17.5523 11 17V11C11 10.4477 11.4477 10 12 10Z" fill="currentColor" stroke="currentColor" strokeWidth="0.5"/>
          </svg>
        );
    }
  };
  
  const visibilityClass = isVisible ? 'visible' : 'hidden';
  const typeClass = getTypeClass();
  
  const getTitle = () => {
    if (notification.title) return notification.title;
    
    switch (notification.type) {
      case 'success': return 'Success';
      case 'error': return 'Error';
      case 'warning': return 'Warning';
      default: return 'Information';
    }
  };
  
  return (
    <div 
      className={`notification-toast ${typeClass} ${visibilityClass}`}
      role="alert"
      aria-live="polite"
      style={progressStyle}
    >
      <div className="content-wrapper">
        <div className="icon-wrapper">
          <span className="icon">{getIcon()}</span>
        </div>
        
        <div className="message-wrapper">
          <h4 className="title">{getTitle()}</h4>
          <p className="message">
            {notification.message}
          </p>
        </div>
        
        <div className="close-button-wrapper">
          <button
            type="button"
            className="close-button"
            onClick={handleClose}
            aria-label="Dismiss"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5.28033 5.28033C5.57322 4.98744 6.0481 4.98744 6.34099 5.28033L8 6.93934L9.65901 5.28033C9.9519 4.98744 10.4268 4.98744 10.7197 5.28033C11.0126 5.57322 11.0126 6.0481 10.7197 6.34099L9.06066 8L10.7197 9.65901C11.0126 9.9519 11.0126 10.4268 10.7197 10.7197C10.4268 11.0126 9.9519 11.0126 9.65901 10.7197L8 9.06066L6.34099 10.7197C6.0481 11.0126 5.57322 11.0126 5.28033 10.7197C4.98744 10.4268 4.98744 9.9519 5.28033 9.65901L6.93934 8L5.28033 6.34099C4.98744 6.0481 4.98744 5.57322 5.28033 5.28033Z" fill="currentColor" stroke="currentColor" strokeWidth="0.5"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

const NotificationContainer = ({ notifications, removeNotification }) => {
  if (!notifications || notifications.length === 0) return null;
  
  return (
    <div 
      className="notification-container"
      aria-live="polite"
      aria-atomic="true"
    >
      {notifications.map(notification => (
        <div key={notification.id} className="toast-wrapper">
          <NotificationToast 
            notification={notification} 
            onDismiss={removeNotification} 
          />
        </div>
      ))}
    </div>
  );
};

export { NotificationToast, NotificationContainer }; 