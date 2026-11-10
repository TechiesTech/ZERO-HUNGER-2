import 'dotenv/config';
import app from './app.js';
import { connectDB } from './config/db.js';

const port = process.env.PORT || 5000;

// Secrets: must exist and be at least 32 characters (message shows length only, never the value)
const validateSecret = (name) => {
  const secret = process.env[name];
  if (!secret || secret.length < 32) {
    console.error(`${name} is missing or shorter than 32 characters (length: ${secret ? secret.length : 'undefined'})`);
    process.exit(1);
  }
};

if (!process.env.MAIL_USER || !process.env.MAIL_APP_PASSWORD) {
  console.warn('MAIL_USER or MAIL_APP_PASSWORD is missing; email verification and password reset emails will fail');
}

validateSecret('JWT_SECRET');
validateSecret('CODE_SECRET');

// Other required variables: fail at startup instead of at the first request
const requiredVars = ['MONGODB_URI', 'CLIENT_URL', 'ADMIN_URL'];
const missingVars = requiredVars.filter((name) => !process.env[name]);
if (missingVars.length > 0) {
  console.error(`Missing environment variables: ${missingVars.join(', ')}`);
  process.exit(1);
}

let server;

const startServer = async () => {
  try {
    await connectDB();

    server = app.listen(port, '0.0.0.0', () => {
      console.log(`Server running on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Render sends SIGTERM on every redeploy: let in-flight requests finish, then exit
const shutdown = (signal) => {
  console.log(`${signal} received, shutting down`);
  if (!server) process.exit(0);
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 10000).unref(); // force exit if requests hang
};
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason);
});

startServer();