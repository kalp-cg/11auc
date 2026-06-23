# AuctionX Real-time Socket Event Documentation

The real-time bidding, timers, chat, and presence are driven by **Socket.IO** events under authentication guards.

---

## 1. Connection Handshake
Sockets must supply their JWT token during connection initialization:
```javascript
const socket = io(SOCKET_URL, {
  auth: {
    token: 'jwt_token_here'
  }
});
```

---

## 2. Client-to-Server Events (Emit)

### 2.1 Join Room Channel
- **Event**: `join_room`
- **Payload**:
  ```json
  {
    "roomCode": "A7B9X2"
  }
  ```
- **Description**: Subscribes the socket connection to the room's message channel, registers user presence, and triggers user join chat logs.

### 2.2 Place Bid
- **Event**: `place_bid`
- **Payload**:
  ```json
  {
    "amount": 1050
  }
  ```
- **Description**: Places a bid. The server calculates remaining wallet capacity, validates that the bid exceeds the highest bid/starting price, updates room memory, and broadcasts the result.

### 2.3 Send Chat Message
- **Event**: `send_message`
- **Payload**:
  ```json
  {
    "message": "Hello operators!"
  }
  ```
- **Description**: Sends a chat message. Broadcasts to all users connected to the room code channel.

### 2.4 Pause Timer (Admin Only)
- **Event**: `pause_auction`
- **Description**: Instructs the timing registry to halt the countdown clock for the current item.

### 2.5 Resume Timer (Admin Only)
- **Event**: `resume_auction`
- **Description**: Resumes the active item timer.

### 2.6 Resolve / Skip Active Item (Admin Only)
- **Event**: `skip_item`
- **Description**: Instantly cuts the active timer to 0, forcing the item to resolve as SOLD (if bids exist) or UNSOLD, and schedules next transition.

---

## 3. Server-to-Client Events (Listen)

### 3.1 Timer Tick Feed
- **Event**: `timer_tick`
- **Payload**:
  ```json
  {
    "timeLeft": 28,
    "currentItemIndex": 0,
    "currentItem": { "name": "Retro Jordan 1", "startingPrice": 500 },
    "currentHighestBid": 650,
    "currentHighestBidder": { "_id": "603f...", "username": "bidder_node_a" },
    "isPaused": false
  }
  ```

### 3.2 Bid Updates
- **Event**: `bid_update`
- **Payload**:
  ```json
  {
    "currentHighestBid": 850,
    "currentHighestBidder": { "_id": "603f...", "username": "bidder_node_b" },
    "bidHistory": [
      { "amount": 850, "userId": { "username": "bidder_node_b" } },
      { "amount": 800, "userId": { "username": "bidder_node_a" } }
    ]
  }
  ```

### 3.3 Item Resolution Banner
- **Event**: `item_resolved`
- **Payload (Sold)**:
  ```json
  {
    "item": { "name": "Retro Jordan 1", "status": "sold" },
    "status": "sold",
    "winner": "bidder_node_a",
    "amount": 800
  }
  ```
- **Payload (Unsold)**:
  ```json
  {
    "item": { "name": "Retro Jordan 1", "status": "unsold" },
    "status": "unsold"
  }
  ```

### 3.4 Presence updates
- **Event**: `presence_update`
- **Payload**:
  ```json
  {
    "onlineUsers": ["heartbeat_admin", "bidder_node_a", "AlphaBidder"]
  }
  ```

### 3.5 Chat Messages
- **Event**: `chat_message`
- **Payload**:
  ```json
  {
    "userId": "603f...",
    "username": "bidder_node_a",
    "message": "Let's win this Rolex!",
    "timestamp": "2026-06-23T10:20:00.000Z"
  }
  ```

### 3.6 Error Alerts
- **Event**: `error_message`
- **Payload**: `"INSUFFICIENT WALLET BALANCE"` (String message)
