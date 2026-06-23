import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');

    if (!email || !password) {
      setLocalError('PLEASE FILL IN ALL REQUIRED FIELDS');
      return;
    }

    const res = await login(email, password);
    if (res.success) {
      navigate('/dashboard');
    } else {
      setLocalError(res.error.toUpperCase());
    }
  };

  return (
    <div className="min-h-screen bg-[#090d16] flex items-center justify-center p-4">
      <div className="w-full max-w-md border-2 border-slate-600 bg-[#121824] p-8 rounded-none shadow-[6px_6px_0px_0px_rgba(217,119,6,1)]">
        {/* Header */}
        <div className="mb-8 text-center border-b-2 border-slate-700 pb-6">
          <h1 className="text-3xl font-black tracking-widest text-amber-500 font-mono">
            AUCTION[X]
          </h1>
          <p className="text-xs font-mono tracking-widest text-slate-400 mt-2">
            SECURE TERMINAL ACCESS PORTAL
          </p>
        </div>

        {/* Errors */}
        {localError && (
          <div className="mb-6 border-2 border-red-700 bg-red-950/40 text-red-500 p-3 rounded-none font-mono text-xs uppercase tracking-wide leading-relaxed">
            <span className="font-bold">ALERT:</span> {localError}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-xs font-mono font-bold tracking-widest text-slate-300 uppercase">
              EMAIL ADDRESS
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-none border-2 border-slate-600 bg-[#090d16] px-4 py-2 font-mono text-sm text-white focus:border-amber-500 focus:outline-none"
              placeholder="operator@auctionx.net"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-mono font-bold tracking-widest text-slate-300 uppercase">
              ACCESS PASSCODE
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-none border-2 border-slate-600 bg-[#090d16] px-4 py-2 font-mono text-sm text-white focus:border-amber-500 focus:outline-none"
              placeholder="••••••••"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-none border-2 border-amber-600 bg-amber-600 hover:bg-amber-500 text-black hover:text-black py-3 font-mono font-bold text-sm tracking-widest uppercase transition-colors disabled:opacity-50"
          >
            {loading ? 'AUTHENTICATING...' : 'ESTABLISH SESSION'}
          </button>
        </form>

        {/* Footer Link */}
        <div className="mt-8 text-center pt-6 border-t border-slate-700/50">
          <p className="text-xs font-mono text-slate-400">
            NEW NODE ACCESS REGISTRATION?{' '}
            <Link
              to="/register"
              className="text-amber-500 hover:text-amber-400 font-bold underline underline-offset-4"
            >
              REGISTER HERE
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
