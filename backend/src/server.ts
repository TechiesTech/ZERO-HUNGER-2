import 'dotenv/config';
import { app } from './app';

/**
 * Zero Hunger — HTTP Server Entry Point
 *
 * Starts the Express server on the configured PORT.
 *
 * TODO: Connect to MongoDB before starting the server:
 *   import { connectDB } from './config/db';
 *   await connectDB();
 *
 * TODO: Attach Socket.io for real-time tracking:
 *   import { createServer } from 'http';
 *   import { initTracking } from './sockets/tracking';
 *   const httpServer = createServer(app);
 *   initTracking(httpServer);
 *   httpServer.listen(PORT, ...);
 */

const PORT = Number(process.env.PORT) || 5000;

app.listen(PORT, () => {
  console.log(`[zerohunger-api] Server running on http://localhost:${PORT}`);
  console.log(`[zerohunger-api] Health: http://localhost:${PORT}/health`);
});
