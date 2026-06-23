# Changelog

All notable changes to the AuctionX project will be documented in this file.

## [2026-06-23]
### Added
- **Phase 4 (Room Management & Lobby Setup)**:
  - Formulated Room REST endpoints: Create Room, Join Room, Get Room Details, and Start Auction.
  - Linked database actions: room creation automatically populates 5 default auction items in MongoDB for instant testing.
  - Developed the Room Lobby UI (`RoomPage.jsx`) listing catalog items, participant lists, and host controls.
  - Mounted room routes on the Express server and hooked up client services.
- **Phase 3 (JWT Authentication)**:
  - Formulated secure JWT parsing middleware, signup encryption, and login handlers.
  - Implemented client AuthContext session hooks and Protected Route guards.
  - Designed retro-industrial LoginPage, RegisterPage, and operations DashboardPage.
  - Wired React Router v7 routes.
- **Phase 2 (Linting, Formatting & Testing)**:
  - Set up Prettier code formatting configs.
  - Resolved ESLint warnings across both packages.
  - Integrated Vitest server test runner.
  - Programmed bid validation services with complete unit tests coverage.
  - Created initial Architectural Decision Records (ADRs).
- **Phase 1 (Scaffolding)**:
  - Scaffolded standard React client and Node/Express server monorepos.
  - Pre-coded all MongoDB/Mongoose models representing user, room, item, bid, and results schema.
  - Deployed Dockerized local MongoDB container.
