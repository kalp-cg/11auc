/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useSocket } from '../hooks/useSocket';
import * as roomService from '../services/roomService';
import { Play, Pause, ChevronRight, Send } from 'lucide-react';

export const RoomPage = () => {
  const { code } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const socket = useSocket();

  // Basic Room Info
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Active Realtime States
  const [roomStatus, setRoomStatus] = useState('lobby');
  const [onlineUsers, setOnlineUsers] = useState([]);
  // participants tracked dynamically
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [socketError, setSocketError] = useState('');

  // Live Bidding States
  const [currentItem, setCurrentItem] = useState(null);
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [isPaused, setIsPaused] = useState(false);
  const [currentHighestBid, setCurrentHighestBid] = useState(null);
  const [currentHighestBidder, setCurrentHighestBidder] = useState(null);
  const [bidHistory, setBidHistory] = useState([]);
  const [customBid, setCustomBid] = useState('');

  // Resolution Broadcast
  const [resolutionMsg, setResolutionMsg] = useState(null);

  // Completed State
  const [auctionResults, setAuctionResults] = useState(null);

  const chatEndRef = useRef(null);

  // Fetch Room REST details on mount
  const fetchRoomDetails = async () => {
    try {
      // Auto-join room first to support direct url links access
      await roomService.joinRoom(code);

      const res = await roomService.getRoom(code);
      if (res.success) {
        setRoom(res.room);
        setRoomStatus(res.room.status);
        // participants state removed

        // If room is already completed on mount, set it
        if (res.room.status === 'completed') {
          // Fetch results from DB if available
          const response = await fetch(
            `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/rooms/${code}`,
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`
              }
            }
          );
          const details = await response.json();
          if (details.success && details.room.status === 'completed') {
            // Fetch the populated result object from api
            const resData = await fetch(
              `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/rooms/${room?._id || details.room._id}/results`,
              {
                headers: {
                  Authorization: `Bearer ${localStorage.getItem('token')}`
                }
              }
            );
            const resultsPayload = await resData.json();
            if (resultsPayload.success) {
              setAuctionResults(resultsPayload.results);
            }
          }
        }
      } else {
        setError(res.error || 'FAILED TO LOAD ROOM DETAILS');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'FAILED TO LOAD ROOM DETAILS');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoomDetails();
  }, [code]);

  // Setup Socket Connection
  useEffect(() => {
    if (!socket) return;

    // Join room
    socket.emit('join_room', { roomCode: code });

    // Handle timer ticks
    socket.on('timer_tick', (data) => {
      setRoomStatus('auction');
      setTimeLeft(data.timeLeft);
      setCurrentItemIndex(data.currentItemIndex);
      setCurrentItem(data.currentItem);
      setCurrentHighestBid(data.currentHighestBid);
      setCurrentHighestBidder(data.currentHighestBidder);
      setIsPaused(data.isPaused);
      setResolutionMsg(null);
    });

    // Handle real-time bids
    socket.on('bid_update', (data) => {
      setCurrentHighestBid(data.currentHighestBid);
      setCurrentHighestBidder(data.currentHighestBidder);
      setBidHistory(data.bidHistory || []);
    });

    // Handle item resolution
    socket.on('item_resolved', (data) => {
      if (data.status === 'sold') {
        setResolutionMsg({
          type: 'sold',
          text: `ITEM SOLD TO ${data.winner.toUpperCase()} FOR $${data.amount}`
        });
      } else {
        setResolutionMsg({
          type: 'unsold',
          text: 'ITEM RESOLVED AS UNSOLD'
        });
      }
    });

    // Handle auction complete
    socket.on('auction_completed', (data) => {
      setRoomStatus('completed');
      setAuctionResults(data.results);
    });

    // Handle chat
    socket.on('chat_message', (data) => {
      setChatMessages((prev) => [...prev, data]);
    });

    // Handle presence updates
    socket.on('presence_update', (data) => {
      setOnlineUsers(data.onlineUsers || []);
      // Refresh participant usernames from API to keep sidebar fully updated
      fetchRoomDetails();
    });

    // Handle errors
    socket.on('error_message', (msg) => {
      setSocketError(msg);
      setTimeout(() => setSocketError(''), 4000);
    });

    // Pause/Resume updates
    socket.on('auction_paused', () => setIsPaused(true));
    socket.on('auction_resumed', () => setIsPaused(false));

    return () => {
      socket.emit('leave_room');
      socket.off('timer_tick');
      socket.off('bid_update');
      socket.off('item_resolved');
      socket.off('auction_completed');
      socket.off('chat_message');
      socket.off('presence_update');
      socket.off('error_message');
      socket.off('auction_paused');
      socket.off('auction_resumed');
    };
  }, [socket, code]);

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleStartAuction = () => {
    if (socket) {
      socket.emit('start_auction');
    }
  };

  const handlePauseAuction = () => {
    if (socket) {
      socket.emit('pause_auction');
    }
  };

  const handleResumeAuction = () => {
    if (socket) {
      socket.emit('resume_auction');
    }
  };

  const handleSkipItem = () => {
    if (socket) {
      socket.emit('skip_item');
    }
  };

  const handlePlaceBid = (e) => {
    e.preventDefault();
    if (!socket || !customBid) return;

    const amt = parseInt(customBid, 10);
    if (isNaN(amt) || amt <= 0) {
      setSocketError('BID AMOUNT MUST BE A POSITIVE NUMBER');
      setTimeout(() => setSocketError(''), 3000);
      return;
    }

    socket.emit('place_bid', { amount: amt });
    setCustomBid('');
  };

  const handleQuickBid = () => {
    if (!socket || !currentItem) return;
    const increment = 100;
    const amt =
      currentHighestBid !== null ? currentHighestBid + increment : currentItem.startingPrice;

    socket.emit('place_bid', { amount: amt });
  };

  const handleSendChat = (e) => {
    e.preventDefault();
    if (!socket || !chatInput.trim()) return;

    socket.emit('send_message', { message: chatInput });
    setChatInput('');
  };

  // Helper: Calculate user's remaining budget
  // Spend = Sum of winning bids on items they won + active high bid if they are highest bidder
  const wonItems =
    room?.items?.filter(
      (it) => it.winnerId?.toString() === user?.id?.toString() && it.status === 'sold'
    ) || [];
  let userSpend = wonItems.reduce((acc, it) => acc + it.winningBid, 0);
  if (currentHighestBidder && currentHighestBidder._id.toString() === user?.id.toString()) {
    userSpend += currentHighestBid;
  }
  const totalWallet = 100000;
  const remainingWallet = totalWallet - userSpend;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#090d16] flex items-center justify-center text-gray-100">
        <div className="border-2 border-slate-600 bg-[#121824] p-8 rounded-none max-w-sm w-full text-center shadow-[4px_4px_0px_0px_rgba(217,119,6,1)]">
          <div className="text-xl font-bold uppercase tracking-wider text-amber-500 mb-4">
            CONNECTING TERMINAL
          </div>
          <div className="font-mono text-xs text-slate-400 animate-pulse uppercase">
            RETRIEVING MEMORY CORE FOR {code}...
          </div>
        </div>
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="min-h-screen bg-[#090d16] flex items-center justify-center p-4">
        <div className="border-2 border-red-700 bg-[#121824] p-8 rounded-none max-w-md w-full shadow-[4px_4px_0px_0px_rgba(239,68,68,1)]">
          <div className="text-xl font-bold text-red-500 font-mono tracking-wider uppercase mb-2">
            TERMINAL ERROR
          </div>
          <p className="font-mono text-xs text-slate-300 uppercase leading-relaxed mb-6">
            {error || 'SPECIFIED ROOM NODE NOT AVAILABLE IN PERSISTENT STORAGE'}
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full rounded-none border-2 border-slate-500 bg-[#090d16] text-white py-2 font-mono text-xs font-bold uppercase hover:bg-slate-700 transition-colors"
          >
            RETURN TO OPERATIONS HUB
          </button>
        </div>
      </div>
    );
  }

  const isAdmin = room.adminId._id.toString() === user?.id.toString();

  return (
    <div className="min-h-screen bg-[#090d16] text-gray-100 flex flex-col font-mono">
      {/* Top Banner Status Bar */}
      <header className="border-b-2 border-slate-700 bg-[#121824] px-6 py-4 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs text-slate-400">
            <span>SECTOR CODE:</span>
            <span className="text-amber-500 font-bold font-sans tracking-wide">{room.code}</span>
            <span className="text-slate-600">|</span>
            <span>PHASE STATE:</span>
            <span
              className={`font-bold ${roomStatus === 'lobby' ? 'text-amber-500' : roomStatus === 'auction' ? 'text-cyan-400' : 'text-emerald-400'}`}
            >
              {roomStatus.toUpperCase()}
            </span>
          </div>
          <h1 className="text-xl font-black text-white mt-1 uppercase tracking-wider">
            {room.name}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {roomStatus === 'auction' && (
            <div className="border border-slate-600 px-3 py-1 bg-[#090d16] text-xs">
              <span className="text-slate-400">YOUR WALLET:</span>{' '}
              <span className="text-emerald-400 font-bold">
                ${remainingWallet.toLocaleString()}
              </span>
            </div>
          )}
          <div className="border border-slate-600 px-3 py-1 bg-[#090d16] text-xs">
            <span className="text-slate-400">HOST:</span>{' '}
            <span className="text-amber-500 font-bold">{room.adminId.username.toUpperCase()}</span>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="border-2 border-slate-500 px-4 py-1 bg-[#090d16] text-xs font-bold uppercase hover:bg-slate-700 transition-colors rounded-none"
          >
            DISCONNECT
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left Side: Dynamic Auction Board */}
        <main className="flex-1 p-6 overflow-y-auto flex flex-col justify-between space-y-6">
          {/* Socket Toast Errors */}
          {socketError && (
            <div className="border-2 border-red-700 bg-red-950/40 text-red-500 p-3 rounded-none text-xs uppercase animate-pulse">
              <span className="font-bold">ALERT:</span> {socketError}
            </div>
          )}

          {/* Lobby Phase */}
          {roomStatus === 'lobby' && (
            <div className="border-2 border-slate-600 bg-[#121824] p-6 rounded-none shadow-[4px_4px_0px_0px_rgba(217,119,6,1)] max-w-3xl mx-auto w-full">
              <h2 className="text-lg font-bold text-amber-500 uppercase tracking-widest border-b border-slate-700 pb-3 mb-4">
                [LOBBY] INCOMING ITEMS CATALOGUE
              </h2>
              <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                {room.items.map((item, index) => (
                  <div
                    key={item._id}
                    className="border border-slate-700 bg-[#090d16] p-4 flex gap-4 items-center rounded-none"
                  >
                    <div className="w-12 h-12 bg-slate-800 flex items-center justify-center font-bold text-amber-500 border border-slate-600">
                      0{index + 1}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-bold text-white uppercase">{item.name}</h3>
                      <p className="text-xs text-slate-400 line-clamp-1">{item.description}</p>
                    </div>
                    <div className="text-right font-mono">
                      <span className="text-xs text-slate-400 block uppercase">START PRICE</span>
                      <span className="text-sm font-bold text-amber-500">
                        ${item.startingPrice}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Lobby Action Banner */}
              <div className="mt-8 border-t border-slate-700 pt-6">
                {isAdmin ? (
                  <div className="text-center space-y-4">
                    <p className="text-xs text-slate-400 uppercase">
                      ALL PREPARATIONS MET. PRESS START TO RUN SYNCHRONIZED AUCTION CYCLE.
                    </p>
                    <button
                      onClick={handleStartAuction}
                      className="w-full sm:w-auto px-8 py-3 rounded-none border-2 border-amber-600 bg-amber-600 hover:bg-amber-500 text-black hover:text-black font-bold text-sm tracking-wider uppercase transition-colors"
                    >
                      START LIVE AUCTION NOW
                    </button>
                  </div>
                ) : (
                  <div className="border border-amber-600/30 bg-amber-950/20 text-center py-4 px-4 text-xs text-amber-500 uppercase tracking-widest animate-pulse">
                    WAITING FOR THE HOST ADMIN TO INITIALIZE THE REALTIME BID CYCLE...
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Auction Phase */}
          {roomStatus === 'auction' && currentItem && (
            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto w-full">
              {/* Item Card Column */}
              <div className="md:col-span-2 space-y-6">
                {/* Active Item Details */}
                <div className="border-2 border-slate-600 bg-[#121824] p-6 rounded-none shadow-[4px_4px_0px_0px_rgba(217,119,6,1)]">
                  <div className="flex justify-between items-start border-b border-slate-700 pb-4 mb-4">
                    <div>
                      <span className="text-xs text-amber-500 font-bold tracking-widest uppercase">
                        ACTIVE ITEM (0{currentItemIndex + 1}/{room.items.length})
                      </span>
                      <h2 className="text-xl font-black text-white uppercase tracking-wider mt-1">
                        {currentItem.name}
                      </h2>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-slate-400 block uppercase">START PRICE</span>
                      <span className="text-lg font-bold text-amber-500 font-mono">
                        ${currentItem.startingPrice}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed mb-6 uppercase">
                    {currentItem.description}
                  </p>

                  {/* Visual Timer Progress Bar */}
                  <div className="space-y-1 mb-2">
                    <div className="flex justify-between text-xs font-mono font-bold tracking-wide">
                      <span className="text-slate-400 uppercase">CLOCK TIMEOUT</span>
                      <span
                        className={`${timeLeft <= 5 ? 'text-red-500 animate-pulse' : 'text-slate-300'}`}
                      >
                        {timeLeft} SECONDS
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 h-3 border border-slate-600 rounded-none overflow-hidden">
                      <div
                        className={`h-full transition-all duration-1000 rounded-none ${timeLeft <= 5 ? 'bg-red-600' : 'bg-amber-600'}`}
                        style={{ width: `${(timeLeft / 30) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Live Bid Controls */}
                <div className="border-2 border-slate-600 bg-[#121824] p-6 rounded-none">
                  {resolutionMsg ? (
                    <div
                      className={`border-2 text-center py-6 font-bold uppercase tracking-widest ${resolutionMsg.type === 'sold' ? 'border-emerald-600 bg-emerald-950/20 text-[#10b981]' : 'border-slate-500 bg-slate-900/40 text-slate-400'}`}
                    >
                      {resolutionMsg.text}
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <button
                          onClick={handleQuickBid}
                          disabled={isPaused}
                          className="rounded-none border-2 border-amber-600 bg-amber-600 hover:bg-amber-500 text-black py-3 font-bold text-xs tracking-wider uppercase disabled:opacity-50"
                        >
                          QUICK BID (+100)
                        </button>
                        <div className="text-xs text-slate-400 flex items-center bg-[#090d16] px-3 border border-slate-700 font-mono leading-relaxed">
                          PLACING BIDS WILL LOCK FUNDS FROM YOUR ACTIVE WALLET BALANCE.
                        </div>
                      </div>

                      <form onSubmit={handlePlaceBid} className="flex gap-3">
                        <input
                          type="number"
                          value={customBid}
                          onChange={(e) => setCustomBid(e.target.value)}
                          placeholder="ENTER CUSTOM VALUE"
                          className="flex-1 rounded-none border-2 border-slate-600 bg-[#090d16] px-4 py-2 text-sm focus:border-amber-500 focus:outline-none font-mono"
                          disabled={isPaused}
                        />
                        <button
                          type="submit"
                          className="rounded-none border-2 border-amber-600 bg-amber-600 hover:bg-amber-500 text-black px-6 font-bold text-xs uppercase"
                          disabled={isPaused}
                        >
                          SUBMIT BID
                        </button>
                      </form>
                    </div>
                  )}
                </div>

                {/* Admin Operations Panel */}
                {isAdmin && (
                  <div className="border-2 border-slate-700 bg-slate-950/50 p-4 rounded-none flex flex-wrap gap-4 items-center justify-between">
                    <span className="text-xs text-slate-400 font-bold uppercase">
                      ADMIN COMMS BOARD:
                    </span>
                    <div className="flex gap-3">
                      {isPaused ? (
                        <button
                          onClick={handleResumeAuction}
                          className="flex items-center space-x-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-black font-bold text-xs uppercase rounded-none"
                        >
                          <Play size={12} /> <span>RESUME</span>
                        </button>
                      ) : (
                        <button
                          onClick={handlePauseAuction}
                          className="flex items-center space-x-1.5 px-3 py-1 bg-amber-600 hover:bg-amber-500 text-black font-bold text-xs uppercase rounded-none"
                        >
                          <Pause size={12} /> <span>PAUSE</span>
                        </button>
                      )}
                      <button
                        onClick={handleSkipItem}
                        className="flex items-center space-x-1.5 px-3 py-1 border border-slate-500 bg-[#090d16] hover:bg-slate-800 text-white font-bold text-xs uppercase rounded-none"
                      >
                        <ChevronRight size={12} /> <span>RESOLVE ITEM</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Live High-Bid column */}
              <div className="space-y-6">
                {/* Status Box */}
                <div className="border-2 border-slate-600 bg-[#121824] p-6 rounded-none text-center shadow-[4px_4px_0px_0px_rgba(16,185,129,1)]">
                  <span className="text-xs text-slate-400 font-bold uppercase block mb-1">
                    CURRENT HIGH BID
                  </span>
                  <div className="text-3xl font-black text-[#10b981] font-mono tracking-wider">
                    ${currentHighestBid !== null ? currentHighestBid.toLocaleString() : '---'}
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-700/50 text-xs">
                    <span className="text-slate-400 block mb-1 uppercase">LEADING BIDDER</span>
                    <span className="text-white font-bold uppercase">
                      {currentHighestBidder ? currentHighestBidder.username : 'NO BIDS YET'}
                    </span>
                  </div>
                </div>

                {/* Local Item Bid log */}
                <div className="border-2 border-slate-600 bg-[#121824] p-4 rounded-none flex-1 flex flex-col h-64">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest border-b border-slate-700 pb-2 mb-3">
                    BID LOGS
                  </h3>
                  <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                    {bidHistory.length === 0 ? (
                      <div className="text-center text-xs text-slate-500 py-12 uppercase font-mono">
                        AWAITING FIRST BID...
                      </div>
                    ) : (
                      bidHistory.map((bid) => (
                        <div
                          key={bid._id}
                          className="flex justify-between items-center border border-slate-800 bg-[#090d16] px-3 py-2 text-xs font-mono"
                        >
                          <span className="font-bold text-slate-300 uppercase">
                            {bid.userId.username}
                          </span>
                          <span className="font-bold text-amber-500">
                            ${bid.amount.toLocaleString()}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Completed Phase Results */}
          {roomStatus === 'completed' && auctionResults && (
            <div className="border-2 border-slate-600 bg-[#121824] p-6 rounded-none shadow-[6px_6px_0px_0px_rgba(16,185,129,1)] max-w-4xl mx-auto w-full space-y-8">
              <div className="border-b-2 border-slate-700 pb-4 text-center">
                <div className="text-sm font-mono text-[#10b981] font-bold tracking-widest uppercase mb-1">
                  SECURE REPORT COMPILATION
                </div>
                <h2 className="text-2xl font-black text-white uppercase tracking-wider">
                  AUCTION ROUND COMPLETED
                </h2>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                {/* Left Side: Winner Table */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest border-b border-slate-700 pb-2">
                    ITEM ACQUISITION LOGS
                  </h3>
                  <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                    {auctionResults.winners.length === 0 ? (
                      <div className="text-center text-xs text-slate-500 py-12 uppercase">
                        ALL ITEMS RESOLVED AS UNSOLD
                      </div>
                    ) : (
                      auctionResults.winners.map((win, idx) => (
                        <div
                          key={idx}
                          className="border border-slate-800 bg-[#090d16] p-3 flex justify-between items-center text-xs font-mono"
                        >
                          <div>
                            <span className="text-slate-400 block mb-0.5 uppercase">ITEM</span>
                            <span className="text-white font-bold uppercase">
                              {win.itemId.name}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-slate-400 block mb-0.5 uppercase">WINNER</span>
                            <span className="text-amber-500 font-bold uppercase">
                              {win.userId.username} (${win.amount.toLocaleString()})
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Right Side: Aggregate Wallet metrics */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest border-b border-slate-700 pb-2">
                    TOTAL SPENDING PROFILE
                  </h3>
                  <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                    {auctionResults.totalByUser.length === 0 ? (
                      <div className="text-center text-xs text-slate-500 py-12 uppercase">
                        ZERO LEDGER EXPENSES INCURRED
                      </div>
                    ) : (
                      auctionResults.totalByUser.map((userTotal, idx) => {
                        const remaining = totalWallet - userTotal.total;
                        return (
                          <div
                            key={idx}
                            className="border border-slate-800 bg-[#090d16] p-3 flex justify-between items-center text-xs font-mono"
                          >
                            <div>
                              <span className="text-slate-400 block mb-0.5 uppercase">
                                OPERATOR
                              </span>
                              <span className="text-white font-bold uppercase">
                                {userTotal.userId.username}
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="text-slate-400 block mb-0.5 uppercase">
                                SPENT / REMAINING
                              </span>
                              <span className="text-emerald-400 font-bold">
                                ${userTotal.total.toLocaleString()}
                              </span>
                              <span className="text-slate-500">
                                {' '}
                                / ${remaining.toLocaleString()}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              {/* Completed Back Button */}
              <div className="border-t border-slate-700 pt-6 text-center">
                <button
                  onClick={() => navigate('/dashboard')}
                  className="rounded-none border-2 border-slate-500 px-6 py-2 bg-[#090d16] hover:bg-slate-700 font-bold text-xs uppercase transition-colors"
                >
                  RETURN TO OPERATIONS HUB
                </button>
              </div>
            </div>
          )}
        </main>

        {/* Right Side: Chat & Presence Panel */}
        <aside className="w-full md:w-80 border-t-2 md:border-t-0 md:border-l-2 border-slate-700 bg-[#121824] flex flex-col justify-between h-[32rem] md:h-auto">
          {/* Active Presence Header */}
          <div className="p-4 border-b border-slate-700/80">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest mb-3">
              OPERATORS IN CHANNEL ({onlineUsers.length})
            </h3>
            <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto pr-1">
              {onlineUsers.map((username) => (
                <div
                  key={username}
                  className="flex items-center space-x-1.5 px-2 py-1 bg-[#090d16] border border-slate-700 text-[10px] text-slate-300 uppercase font-mono"
                >
                  <span className="w-1.5 h-1.5 bg-[#10b981] inline-block rounded-none"></span>
                  <span>{username}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Chat Messages Log */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#090d16]/30">
            {chatMessages.map((msg, index) => {
              const isSys = msg.userId === 'system';
              return (
                <div key={index} className="text-xs font-mono">
                  {isSys ? (
                    <span className="text-red-500 font-bold uppercase leading-relaxed">
                      [SYS]: {msg.message}
                    </span>
                  ) : (
                    <span className="text-slate-300 leading-relaxed">
                      <span className="text-amber-500 font-bold uppercase mr-1">
                        {msg.username}:
                      </span>
                      {msg.message}
                    </span>
                  )}
                </div>
              );
            })}
            <div ref={chatEndRef} />
          </div>

          {/* Chat Entry Console */}
          <form onSubmit={handleSendChat} className="p-4 border-t border-slate-700 flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="TYPE TRANSMISSION..."
              className="flex-1 rounded-none border border-slate-600 bg-[#090d16] px-3 py-1.5 text-xs text-white focus:border-amber-500 focus:outline-none"
            />
            <button
              type="submit"
              className="rounded-none border border-amber-600 bg-amber-600 hover:bg-amber-500 text-black px-3 font-bold text-xs flex items-center justify-center"
            >
              <Send size={12} />
            </button>
          </form>
        </aside>
      </div>
    </div>
  );
};
