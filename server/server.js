const http = require('http');
const app = require('./app');
const { initSockets } = require('./sockets/index');

const PORT = process.env.PORT || 5000;

// Create HTTP server
const server = http.createServer(app);

// Initialize Sockets
const io = initSockets(server);

// Attach io object to app instance for route access if needed
app.set('io', io);

// Start server
server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
