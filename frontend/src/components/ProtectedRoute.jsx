import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, role, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-clinical-600 border-t-transparent"></div>
          <p className="text-sm font-medium text-slate-500">Loading AlzCare session...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    const fallbackPath = role === 'Admin' ? '/admin-dashboard' : (role === 'Doctor' ? '/doctor-dashboard' : '/patient-dashboard');
    return <Navigate to={fallbackPath} replace />;
  }

  return children;
};

export default ProtectedRoute;
