import mongoose from 'mongoose';

export const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected');
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    if (err.message?.includes('ENOTFOUND') || err.message?.includes('getaddrinfo')) {
      console.error('Check: Is the cluster host correct in .env? (e.g. cluster0.ybqxp9g.mongodb.net)');
    }
    if (err.message?.includes('auth failed') || err.message?.includes('Authentication failed')) {
      console.error('Check: Username and password in .env (Atlas Database Access).');
    }
    process.exit(1);
  }
};
