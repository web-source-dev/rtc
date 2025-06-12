import React, { createContext, useState, useCallback, useRef } from 'react';

export const AppStateContext = createContext();

export const ERROR_TYPES = {
  MEDIA_ACCESS: 'media_access',
  ROOM_CONNECTION: 'room_connection',
  PEER_CONNECTION: 'peer_connection',
  SERVER_CONNECTION: 'server_connection',
  UNKNOWN: 'unknown'
};

export const AppStateProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');

  const [error, setError] = useState(null);
  
  const [notifications, setNotifications] = useState([]);
  
  const timeoutIdsRef = useRef({});
  
  const startLoading = useCallback((message = 'Loading...') => {
    setIsLoading(true);
    setLoadingMessage(message);
  }, []);
  
  const stopLoading = useCallback(() => {
    setIsLoading(false);
    setLoadingMessage('');
  }, []);
  
  const setAppError = useCallback((type = ERROR_TYPES.UNKNOWN, message, details = null) => {
    setError({ type, message, details, timestamp: Date.now() });
  }, []);
  
  const clearError = useCallback(() => {
    setError(null);
  }, []);
  
  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    if (timeoutIdsRef.current[id]) {
      clearTimeout(timeoutIdsRef.current[id]);
      delete timeoutIdsRef.current[id];
    }
  }, []);
  
  const addNotification = useCallback((message, type = 'info', autoHide = true, duration = 5000) => {
    const id = Date.now();
    const notification = { id, message, type, timestamp: Date.now() };
    
    setNotifications(prev => [...prev, notification]);
    
    if (autoHide) {
      const timeoutId = setTimeout(() => {
        removeNotification(id);
      }, duration);

      timeoutIdsRef.current[id] = timeoutId;
    }
    
    return id;
  }, [removeNotification]);
  
  return (
    <AppStateContext.Provider value={{
      isLoading,
      loadingMessage,
      startLoading,
      stopLoading,
      
      error,
      setAppError,
      clearError,
      
      notifications,
      addNotification,
      removeNotification
    }}>
      {children}
    </AppStateContext.Provider>
  );
};

export default AppStateProvider; 