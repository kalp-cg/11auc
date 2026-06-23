# Architecture Decision Records (ADR)

This file documents the key technical decisions made during the design and build of the AuctionX platform.

---

## [2026-06-23] — Decision: Server-Authoritative Timing Engine
- **Why**: Real-time synchronized auctions are prone to countdown discrepancies due to client network latency and device clock drift. If the timer logic ran on the client, it would allow malicious users to manipulate the client clock or bid after the auction actually ended.
- **Decision**: The countdown logic will run authoritatively on the backend server. A central timer registry loops through active items, ticking down the time in memory and broadcasting `timer_tick` events every second to all connected clients in the room. Item expiration, lock status, and result resolution (SOLD vs UNSOLD) are decided and persisted by the server immediately upon timer expiration.
- **Alternatives considered**: Client-side countdowns with a server timeout fallback (too error-prone and hard to synchronize).

---

## [2026-06-23] — Decision: Socket.IO Authentication via Handshake Middleware
- **Why**: Security is paramount. We must prevent unauthorized users from hijacking room events, spoofing user identities, or placing illegal bids.
- **Decision**: The Socket.IO server will authenticate all connections during the handshake phase using JWT validation middleware. The client must supply their JWT token (received during login) in the `auth.token` field during the connection handshake. Connections without a valid JWT are rejected immediately.
- **Alternatives considered**: Authenticating via a custom message event (e.g. `auth` event) after connection (risky, as sockets remain unauthenticated and active for a brief period).

---

## [2026-06-23] — Decision: State Machine for Auction Rooms
- **Why**: Room state transitions must be predictable and persistent.
- **Decision**: We define a strict state machine: `LOBBY` -> `AUCTION` -> `COMPLETED`.
  - **LOBBY**: Participants can join, chat, and review the upcoming items. Admin starts the auction.
  - **AUCTION**: Server presents items one-at-a-time. Participants can place live bids. The admin can pause or resume the timer.
  - **COMPLETED**: The server generates aggregated results metrics, detailing who won what and total budgets spent, persisting them to the `AuctionResults` collection.
- **Alternatives considered**: Dynamic phase systems (too complex for a predictable room format).

---

## [2026-06-23] — Decision: Retro-Industrial Styling Design Constraints
- **Why**: Standard UI templates yield a generic look. We need a visually striking, premium dashboard feel matching the rules in `readme_file_ai`.
- **Decision**: Implement a sharp, data-dense look:
  - Strict limit of 3 primary colors: Ochre Gold (`#d97706`), Cyber Green (`#10b981`), and Muted Cold Slate (`#475569`).
  - No rounded corners on any cards, inputs, borders, or modals (`rounded-none`).
  - Double-width borders (`border-2`) and heavy square shadows for cards and active items.
  - Monospace font for numerical logs, timers, and bids.
