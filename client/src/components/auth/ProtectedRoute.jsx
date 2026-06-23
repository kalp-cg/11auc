import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#090d16] flex items-center justify-center text-gray-100">
        <div className="border-2 border-slate-600 bg-[#121824] p-8 rounded-none max-w-sm w-full text-center shadow-[4px_4px_0px_0px_rgba(217,119,6,1)]">
          <div className="text-xl font-bold uppercase tracking-wider text-amber-500 mb-4">
            AUTHENTICATING
          </div>
          <div className="font-mono text-sm text-slate-400 animate-pulse">
            LOADING SESSION STATE...
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};
