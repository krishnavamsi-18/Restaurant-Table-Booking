import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation as useRouterLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LocationProvider, useLocation } from './contexts/LocationContext';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import LocationAccess from './components/LocationAccess';
import LocationSetup from './components/LocationSetup';
import LocationSettings from './components/LocationSettings';
import RestaurantList from './components/restaurants/RestaurantList';
import RestaurantDetail from './components/restaurants/RestaurantDetail';
import ReservationForm from './components/reservations/ReservationForm';
import MyReservations from './components/reservations/MyReservations';
import VoiceBot from './components/voicebot/VoiceBot';
import Navbar from './components/Navbar';

// Protected Route Component that checks both auth and location
const ProtectedRoute: React.FC<{ children: React.ReactNode; requireLocation?: boolean }> = ({ 
  children, 
  requireLocation = false 
}) => {
  const { user, isLoading: authLoading } = useAuth();
  const { location } = useLocation();

  if (authLoading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If location is required and not set, redirect to location setup
  if (requireLocation && !location && !localStorage.getItem('selectedCity')) {
    return <Navigate to="/location-setup" replace />;
  }

  return <>{children}</>;
};

// Public Route Component (redirect to location-settings if already logged in)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  // Don't redirect if user is already logged in - let the component handle it
  // This prevents redirect loops during registration/login processes
  return <>{children}</>;
};

function AppContent() {
  return (
    <LocationProvider>
      <Router
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true
        }}
      >
        <div className="App">
          <Navbar />
          {/** VoiceBot visibility controller based on current route */}
          {/** Wrapper component to conditionally render VoiceBot */}
          {/** Declared inside Router to access router location context */}
          {(() => {
            const VoiceBotWrapper: React.FC = () => {
              const { pathname } = useRouterLocation();
              const hiddenPaths = [
                '/login',
                '/register',
                '/location',
                '/location-setup',
                '/location-settings'
              ];
              if (hiddenPaths.includes(pathname)) return null;
              return <VoiceBot />;
            };
            // Return a React element from the IIFE
            return <VoiceBotWrapper />;
          })()}
          <Routes>
            {/* Public Routes */}
            <Route 
              path="/login" 
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              } 
            />
            <Route 
              path="/register" 
              element={
                <PublicRoute>
                  <Register />
                </PublicRoute>
              } 
            />


            {/* Protected Routes */}
            <Route 
              path="/location-setup" 
              element={
                <ProtectedRoute>
                  <LocationSetup />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/location" 
              element={
                <ProtectedRoute>
                  <LocationAccess />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/location-settings" 
              element={
                <ProtectedRoute>
                  <LocationSettings />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/restaurants" 
              element={
                <ProtectedRoute>
                  <RestaurantList />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/restaurant/:id" 
              element={
                <ProtectedRoute>
                  <RestaurantDetail />
                </ProtectedRoute>
              } 
            />
            <Route 
                path="/reservations" 
                element={
                  <ProtectedRoute>
                    <MyReservations />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/reservation/:id" 
                element={
                  <ProtectedRoute>
                    <ReservationForm />
                  </ProtectedRoute>
                } 
              />

            {/* Default Route */}
            <Route path="/" element={<Navigate to="/restaurants" replace />} />
            
            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </LocationProvider>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
