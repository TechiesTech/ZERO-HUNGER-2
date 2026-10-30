import mongoose from 'mongoose';

/**
 * Connect to MongoDB database using Mongoose.
 */
export const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not defined in environment variables');
  }

  await mongoose.connect(uri, {
    dbName: 'zerohunger',
  });

  console.log(`MongoDB connected to database: ${mongoose.connection.name}`);
};

export default connectDB;
