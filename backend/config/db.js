const mongoose = require('mongoose');

/**
 * Sanitizes a MongoDB connection string to safely log without exposing passwords or credentials.
 * Handles standard 'mongodb://' and DNS seedlist 'mongodb+srv://' connection formats.
 */
const sanitizeMongoUri = (uri) => {
  if (!uri || typeof uri !== 'string') return '[UNDEFINED_URI]';
  return uri.replace(/(mongodb(?:\+srv)?:\/\/[^:]+:)([^@]+)(@)/i, '$1*****$3');
};

const connectDB = async () => {
  // Check both MONGO_URI and MONGODB_URI (standard across cloud providers and Render)
  const rawUri = process.env.MONGO_URI || process.env.MONGODB_URI;
  const mongoUri = rawUri ? rawUri.trim().replace(/^["']|["']$/g, '') : null;
  const isProduction = process.env.NODE_ENV === 'production';

  // 1. Strict Production Validation: strictly forbid silent fallback to localhost
  if (isProduction) {
    if (!mongoUri) {
      console.error('================================================================');
      console.error('[FATAL DATABASE CONFIGURATION ERROR]');
      console.error('Neither MONGO_URI nor MONGODB_URI environment variable is configured in production.');
      console.error('Render containers cannot connect to 127.0.0.1:27017 (no local MongoDB daemon exists in cloud containers).');
      console.error('');
      console.error('Required Action in Render Dashboard:');
      console.error('1. Navigate to: Dashboard -> Your Backend Web Service -> Environment');
      console.error('2. Add Environment Variable:');
      console.error('   Key:   MONGO_URI');
      console.error('   Value: mongodb+srv://<username>:<password>@cluster0.xxx.mongodb.net/alzcare?retryWrites=true&w=majority');
      console.error('3. Save changes to trigger a fresh deployment.');
      console.error('================================================================');
      process.exit(1);
    }

    if (mongoUri.includes('127.0.0.1') || mongoUri.includes('localhost')) {
      console.error('================================================================');
      console.error('[FATAL DATABASE CONFIGURATION ERROR]');
      console.error(`Production database URI is configured to point to localhost: ${sanitizeMongoUri(mongoUri)}`);
      console.error('Render isolated containers cannot reach your local machine localhost.');
      console.error('Required Action: Update MONGO_URI in Render to your remote MongoDB Atlas cluster connection string.');
      console.error('================================================================');
      process.exit(1);
    }
  }

  // Substitute credentials if placeholders exist in URI and explicit variables are provided in Render
  let connectionUri = mongoUri;
  if (connectionUri && process.env.MONGODB_USERNAME && process.env.MONGODB_PASSWORD) {
    if (/<username>|<db_username>|<password>|<db_password>/i.test(connectionUri)) {
      connectionUri = connectionUri
        .replace(/<username>|<db_username>/gi, encodeURIComponent(process.env.MONGODB_USERNAME.trim()))
        .replace(/<password>|<db_password>/gi, encodeURIComponent(process.env.MONGODB_PASSWORD.trim()));
    }
  }

  // 2. Development fallback
  connectionUri = connectionUri || 'mongodb://127.0.0.1:27017/alzcare';

  if (!isProduction && !mongoUri) {
    console.log('[DEV] No MONGO_URI specified in environment. Using local instance: mongodb://127.0.0.1:27017/alzcare');
  }

  try {
    const conn = await mongoose.connect(connectionUri, {
      serverSelectionTimeoutMS: 10000, // 10 second timeout for server selection
    });

    console.log(`MongoDB Connected successfully: host=${conn.connection.host}, database=${conn.connection.name}`);
  } catch (error) {
    console.error('================================================================');
    console.error(`Database Connection Error: ${error.message}`);
    console.error(`Target: ${sanitizeMongoUri(connectionUri)}`);

    if (error.name === 'MongooseServerSelectionError') {
      console.error('');
      console.error('MongoDB Atlas Connection Troubleshooting:');
      console.error('1. IP Access List (Whitelist):');
      console.error('   In MongoDB Atlas -> Network Access, ensure 0.0.0.0/0 (Allow Access from Anywhere) is added.');
      console.error('   Render uses dynamic IP addresses that will be blocked unless 0.0.0.0/0 is whitelisted.');
      console.error('2. Database User Credentials:');
      console.error('   In MongoDB Atlas -> Database Access, verify the username and password match your connection string.');
      console.error('3. Password Special Characters:');
      console.error('   If your password contains special characters (e.g. @, :, /, #, %, ?), URL-encode them.');
    }
    console.error('================================================================');
    process.exit(1);
  }
};

// Listen for Mongoose connection events
mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB connection lost. Driver will attempt to reconnect...');
});

mongoose.connection.on('reconnected', () => {
  console.log('MongoDB reconnected successfully.');
});

module.exports = connectDB;
