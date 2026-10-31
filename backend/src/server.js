import 'dotenv/config';
import { createServer } from 'http';
import app from './app.js';
import { connectDB } from './config/db.js';
import { initTracking } from './sockets/tracking.js';

const port = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

    const httpServer = createServer(app);
    initTracking(httpServer);

    httpServer.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
