# AuctionX — Realtime Auction Room Platform

AuctionX is a production-quality full-stack realtime auction application. It allows administrators to host auction rooms with realtime synchronized timers, presence tracking, live bidding, items list resolution, room chat, and detailed results analytics.

---

## Technical Assumptions

The project operates under the following design assumptions:
1. **Admin Authority**: Only the user who created the room (the Admin) has the authority to transition phases, start the auction, pause/resume the countdown, or skip an item.
2. **Authoritative Server Timer**: The countdown timer (30 seconds per item) runs authoritatively on the Node.js/Express server. Client-side clocks are synchronized against periodic tick events received via WebSockets to prevent client-side time manipulation.
3. **Single Active Session**: A user can only be connected to one auction room at a time. Authenticating a socket on a new room will automatically disconnect the user's socket from any previous room.
4. **Mock Wallet Budget**: Participants start with a fixed mock balance ($100,000). They cannot place a bid that exceeds their remaining wallet capacity.
5. **Item States**: Items follow a sequential order. When the 30-second timer expires, the item is resolved immediately. It is marked as `sold` (if there was at least one bid) or `unsold` (if no bids were placed). The auction automatically advances to the next item after a 3-second delay.

---

## UI Styling Guidelines (Retro-Industrial)

To establish a strict visual theme and avoid generic AI designs, we enforce the following rules:
- **Sharp Elements Only**: Corners are styled with `rounded-none`. No rounded borders or soft modern gradients.
- **Three Colors Limit**:
  - **Ochre Gold (`#d97706`)**: Main active actions and highlights.
  - **Cyber Green (`#10b981`)**: Success states and positive connections.
  - **Muted Cold Slate (`#475569`)**: Structural borders, subtext, and background inputs.
- **Font Face**: Inter, paired with Monospace rendering for numbers, budgets, bid counts, and active clocks.

---

## Directory Structure

```
11auc/
├── client/          # React + Vite client application
└── server/          # Express.js REST API + Socket.IO server
```

---

## Quick Start (Local Development)

### Prerequisites
- Node.js (v18+)
- MongoDB running locally or inside a Docker container (default: `mongodb://127.0.0.1:27017/auctionx`)

### Step 1: Run Backend
1. Navigate to `/server`
2. Install dependencies: `npm install`
3. Configure environment variables in `.env` (copied from `.env.example`)
4. Start development server: `npm run dev` (runs on `http://localhost:5000`)

### Step 2: Run Frontend
1. Navigate to `/client`
2. Install dependencies: `npm install`
3. Configure environment variables in `.env` (copied from `.env.example`)
4. Start Vite development server: `npm run dev` (runs on `http://localhost:5173`)
