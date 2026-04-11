import React from 'react';
import { Navigate } from 'react-router-dom';
import { authService } from '../services/authService';

const PrivateRoute = ({ children, roles = [] }) => {
  const isAuthenticated = authService.isAuthenticated();
  const user = authService.getStoredUser();

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (roles.length > 0 && (!user || !roles.includes(user.role))) {
    return <Navigate to="/" />;
  }
  
  return children;
};

export default PrivateRoute;
