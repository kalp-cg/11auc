# AuctionX REST API Documentation

Base URL: `/api`

---

## 1. Authentication Endpoints

### 1.1 User Signup
- **URL**: `/auth/register`
- **Method**: `POST`
- **Auth Required**: No
- **Request Body**:
  ```json
  {
    "username": "operator_x",
    "email": "operator_x@auctionx.net",
    "password": "securepassword"
  }
  ```
- **Success Response** (201 Created):
  ```json
  {
    "success": true,
    "token": "eyJhbGciOi...",
    "user": {
      "id": "603f...",
      "username": "operator_x",
      "email": "operator_x@auctionx.net"
    }
  }
  ```

### 1.2 User Login
- **URL**: `/auth/login`
- **Method**: `POST`
- **Auth Required**: No
- **Request Body**:
  ```json
  {
    "email": "operator_x@auctionx.net",
    "password": "securepassword"
  }
  ```
- **Success Response** (200 OK):
  ```json
  {
    "success": true,
    "token": "eyJhbGciOi...",
    "user": {
      "id": "603f...",
      "username": "operator_x",
      "email": "operator_x@auctionx.net"
    }
  }
  ```

### 1.3 Get Current User Session
- **URL**: `/auth/me`
- **Method**: `GET`
- **Auth Required**: Yes (Bearer Token)
- **Success Response** (200 OK):
  ```json
  {
    "success": true,
    "user": {
      "id": "603f...",
      "username": "operator_x",
      "email": "operator_x@auctionx.net"
    }
  }
  ```

---

## 2. Room Management Endpoints

### 2.1 Create Room
- **URL**: `/rooms`
- **Method**: `POST`
- **Auth Required**: Yes (Bearer Token)
- **Request Body**:
  ```json
  {
    "name": "SNEAKERS_HQ"
  }
  ```
- **Success Response** (201 Created):
  ```json
  {
    "success": true,
    "room": {
      "id": "603f...",
      "name": "SNEAKERS_HQ",
      "code": "A7B9X2",
      "adminId": "603f...",
      "status": "lobby"
    },
    "items": [
      { "name": "Retro Jordan 1 Chicago (1985)", "startingPrice": 500 },
      { "name": "Vintage Rolex Submariner", "startingPrice": 8000 }
      // ... 5 default items
    ]
  }
  ```

### 2.2 Join Room by Code
- **URL**: `/rooms/join`
- **Method**: `POST`
- **Auth Required**: Yes (Bearer Token)
- **Request Body**:
  ```json
  {
    "code": "A7B9X2"
  }
  ```
- **Success Response** (200 OK):
  ```json
  {
    "success": true,
    "message": "Joined room successfully",
    "roomCode": "A7B9X2",
    "roomId": "603f..."
  }
  ```

### 2.3 Get Room Details
- **URL**: `/rooms/:code`
- **Method**: `GET`
- **Auth Required**: Yes (Bearer Token)
- **Success Response** (200 OK):
  ```json
  {
    "success": true,
    "room": {
      "id": "603f...",
      "name": "SNEAKERS_HQ",
      "code": "A7B9X2",
      "adminId": { "_id": "603f...", "username": "operator_x" },
      "participants": [{ "userId": { "username": "operator_x" } }],
      "status": "lobby",
      "items": [...]
    }
  }
  ```

### 2.4 Start Room Auction
- **URL**: `/rooms/:code/start`
- **Method**: `POST`
- **Auth Required**: Yes (Bearer Token - Admin only)
- **Success Response** (200 OK):
  ```json
  {
    "success": true,
    "message": "Auction started successfully",
    "status": "auction"
  }
  ```

### 2.5 Get Room Results
- **URL**: `/rooms/:roomId/results`
- **Method**: `GET`
- **Auth Required**: Yes (Bearer Token)
- **Success Response** (200 OK):
  ```json
  {
    "success": true,
    "results": {
      "roomId": "603f...",
      "winners": [
        { "userId": { "username": "bidder_node_a" }, "itemId": { "name": "Retro Jordan 1" }, "amount": 800 }
      ],
      "totalByUser": [
        { "userId": { "username": "bidder_node_a" }, "total": 800 }
      ]
    }
  }
  ```
