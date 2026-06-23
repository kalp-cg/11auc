import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import * as roomService from '../services/roomService';

export const DashboardPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [roomName, setRoomName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    setError('');
    if (!roomName.trim()) {
      setError('ROOM NAME IS REQUIRED');
      return;
    }
    setLoading(true);
    try {
      const res = await roomService.createRoom(roomName);
      if (res.success) {
        navigate(`/room/${res.room.code}`);
      } else {
        setError(res.error || 'FAILED TO CREATE ROOM');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'FAILED TO CREATE ROOM');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = async (e) => {
    e.preventDefault();
    setError('');
    if (!roomCode.trim() || roomCode.length !== 6) {
      setError('INVALID 6-CHARACTER ROOM CODE');
      return;
    }
    setLoading(true);
    try {
      const res = await roomService.joinRoom(roomCode);
      if (res.success) {
        navigate(`/room/${res.roomCode}`);
      } else {
        setError(res.error || 'FAILED TO JOIN ROOM');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'FAILED TO JOIN ROOM');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-gray-100 flex flex-col">
      {/* Navigation Header */}
      <header className="border-b-2 border-slate-700 bg-[#121824] px-6 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <span className="w-2.5 h-2.5 bg-[#10b981] inline-block rounded-none animate-ping"></span>
          <span className="text-xl font-black tracking-widest text-amber-500 font-mono">
            AUCTION[X]
          </span>
        </div>
        <div className="flex items-center space-x-6">
          <div className="hidden sm:flex flex-col text-right font-mono text-xs">
            <span className="text-slate-400">OPERATOR SECURE ID:</span>
            <span className="text-amber-500 font-bold">{user?.username.toUpperCase()}</span>
          </div>
          <button
            onClick={logout}
            className="rounded-none border-2 border-slate-500 px-4 py-1.5 font-mono text-xs font-bold uppercase hover:bg-slate-700 transition-colors"
          >
            TERMINATE SESSION
          </button>
        </div>
      </header>

      {/* Content Area */}
      <main className="flex-1 p-6 max-w-4xl mx-auto w-full flex flex-col justify-center space-y-8">
        <div className="border-b-2 border-slate-800 pb-4">
          <h2 className="text-2xl font-black font-mono tracking-wider text-slate-300 uppercase">
            OPERATIONS HUB
          </h2>
          <p className="text-xs font-mono text-slate-400 mt-1 uppercase">
            Create or connect to active synchronized auction rooms.
          </p>
        </div>

        {error && (
          <div className="border-2 border-red-700 bg-red-950/40 text-red-500 p-3 rounded-none font-mono text-xs uppercase">
            <span className="font-bold">ALERT:</span> {error}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-8">
          {/* Create Room Card */}
          <div className="border-2 border-slate-600 bg-[#121824] p-6 rounded-none shadow-[4px_4px_0px_0px_rgba(217,119,6,1)] flex flex-col justify-between">
            <div>
              <div className="text-sm font-mono text-amber-500 font-bold tracking-widest uppercase mb-2">
                [01] CREATE ROOM
              </div>
              <p className="text-xs text-slate-400 font-mono mb-6 leading-relaxed">
                Initialize a new server-controlled auction instance. You will be set as the Room
                Admin.
              </p>
            </div>

            <form onSubmit={handleCreateRoom} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-slate-300 uppercase mb-1">
                  ROOM NAMESPACE
                </label>
                <input
                  type="text"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  className="w-full rounded-none border-2 border-slate-600 bg-[#090d16] px-4 py-2 font-mono text-sm text-white focus:border-amber-500 focus:outline-none"
                  placeholder="e.g. SNEAKERS_HQ"
                  disabled={loading}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-none border-2 border-amber-600 bg-amber-600 hover:bg-amber-500 text-black py-2.5 font-mono font-bold text-xs tracking-wider uppercase transition-colors"
              >
                {loading ? 'INITIALIZING...' : 'LAUNCH SESSION'}
              </button>
            </form>
          </div>

          {/* Join Room Card */}
          <div className="border-2 border-slate-600 bg-[#121824] p-6 rounded-none shadow-[4px_4px_0px_0px_rgba(16,185,129,1)] flex flex-col justify-between">
            <div>
              <div className="text-sm font-mono text-[#10b981] font-bold tracking-widest uppercase mb-2">
                [02] JOIN ROOM
              </div>
              <p className="text-xs text-slate-400 font-mono mb-6 leading-relaxed">
                Connect to an active room using a 6-character access passcode shared by the admin.
              </p>
            </div>

            <form onSubmit={handleJoinRoom} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-slate-300 uppercase mb-1">
                  ROOM PASSCODE (6-CHAR)
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  className="w-full rounded-none border-2 border-slate-600 bg-[#090d16] px-4 py-2 font-mono text-sm text-white focus:border-[#10b981] focus:outline-none uppercase tracking-widest text-center font-bold"
                  placeholder="A7B9X2"
                  disabled={loading}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-none border-2 border-[#10b981] bg-[#10b981] hover:bg-[#059669] text-black py-2.5 font-mono font-bold text-xs tracking-wider uppercase transition-colors"
              >
                {loading ? 'CONNECTING...' : 'ESTABLISH CONNECTION'}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};
