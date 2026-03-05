import mongoose from 'mongoose';

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 3000;

export const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI is not set in backend/.env');
    return;
  }
  if (uri.includes('<db_password>')) {
    console.error('MONGODB_URI still contains <db_password>. Replace it with your real Atlas password.');
    return;
  }

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      await mongoose.connect(uri);
      console.log('MongoDB connected');
      return;
    } catch (err) {
      console.error(`MongoDB connection attempt ${attempt}/${MAX_RETRIES}:`, err.message);
      if (err.message?.includes('ENOTFOUND') || err.message?.includes('getaddrinfo')) {
        console.error('Check: Is the cluster host correct in .env? (e.g. cluster0.ybqxp9g.mongodb.net)');
      }
      if (err.message?.includes('auth failed') || err.message?.includes('Authentication failed')) {
        console.error('Check: Username and password in .env (Atlas Database Access).');
      }
      if (err.message?.includes('whitelist') || err.message?.includes('IP')) {
        console.error('Check: Add your current IP in Atlas → Network Access → Add IP Address.');
      }
      if (attempt < MAX_RETRIES) {
        console.log(`Retrying in ${RETRY_DELAY_MS / 1000}s...`);
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
      }
    }
  }
};

export const isDBConnected = () => mongoose.connection.readyState === 1;
