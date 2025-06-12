import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { SocketContextProvider } from './context/SocketContext';
import { AppStateProvider } from './context/AppStateContext';
import { AttentionProvider } from './context/AttentionContext';
import { StateChangeProvider } from './context/StateChangeContext';
import { AuthProvider } from './context/AuthContext';
import { NotificationContainer } from './components/ui/NotificationToast';
import LoadingSpinner from './components/ui/LoadingSpinner';
import ErrorMessage from './components/ui/ErrorMessage';
import { useAppState } from './hooks/useAppState';
import Navbar from './components/ui/Navbar';

import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

import RoomSelection from './components/room/RoomSelection';
import DeviceSelection from './components/room/DeviceSelection';
import VideoChat from './components/video/VideoChat';
import JoinRoom from './components/room/JoinRoom';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import ProtectedRoute from './components/auth/ProtectedRoute';
import InstructorDashboard from './components/instructor/InstructorDashboard';
import MeetingAnalytics from './components/instructor/MeetingAnalytics';
import { useAuth } from './context/AuthContext';

const InstructorRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (user?.role !== 'instructor') {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

const AppContent = () => {
  const { 
    isLoading, 
    loadingMessage, 
    error, 
    clearError,
    notifications, 
    removeNotification 
  } = useAppState();

  return (
    <Router>
      <div className="app-container bg-white text-dark vh-100 d-flex flex-column">
        <Navbar />
        
        <div className="flex-grow-1 d-flex flex-column">
          {isLoading && <LoadingSpinner fullScreen message={loadingMessage} />}
          
          {error && (
            <div className="error-container">
              <ErrorMessage
                error={error}
                onDismiss={clearError}
                onRetry={() => {
                  clearError();
                }}
              />
            </div>
          )}
          
          <NotificationContainer 
            notifications={notifications} 
            removeNotification={removeNotification} 
          />
            
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<RoomSelection />} />
              <Route path="/join/:roomId" element={<JoinRoom />} />
              <Route path="/setup" element={<DeviceSelection />} />
              <Route path="/room/:roomId" element={<VideoChat />} />
            </Route>
            
            <Route 
              path="/instructor/dashboard" 
              element={
                <InstructorRoute>
                  <InstructorDashboard />
                </InstructorRoute>
              } 
            />
            <Route 
              path="/instructor/analytics/:id" 
              element={
                <InstructorRoute>
                  <MeetingAnalytics />
                </InstructorRoute>
              } 
            />
            
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
};

function App() {
  return (
    <AppStateProvider>
      <AuthProvider>
        <SocketContextProvider>
          <AttentionProvider>
            <StateChangeProvider>
              <AppContent />
            </StateChangeProvider>
          </AttentionProvider>
        </SocketContextProvider>
      </AuthProvider>
    </AppStateProvider>
  );
}

export default App;
