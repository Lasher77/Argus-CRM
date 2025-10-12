import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

const hasAccessToken = () => {
  if (typeof window === 'undefined') {
    return false;
  }

  return Boolean(window.localStorage.getItem('accessToken'));
};

const RequireAuth = ({ children }) => {
  const location = useLocation();

  if (!hasAccessToken()) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default RequireAuth;
