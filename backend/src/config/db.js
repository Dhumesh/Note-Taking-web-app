import mongoose from 'mongoose';

export const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error('MONGODB_URI is not set in backend/.env');
    }
    if (uri.includes('<db_password>')) {
      throw new Error('MONGODB_URI still contains <db_password>. Replace it with your real Atlas password.');
    }

    await mongoose.connect(uri);
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
