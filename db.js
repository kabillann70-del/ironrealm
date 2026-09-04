const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

let isConnected = false;
const inMemoryUsers = new Map();
const DB_FILE = path.join(__dirname, 'local_db.json');

// Load from local JSON if available
if (fs.existsSync(DB_FILE)) {
  try {
    const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    for (const [k, v] of Object.entries(data)) {
      inMemoryUsers.set(k, v);
    }
  } catch (err) {
    console.error('Error loading local_db.json:', err.message);
  }
}

const saveLocalDb = () => {
  try {
    const obj = {};
    for (const [k, v] of inMemoryUsers.entries()) {
      obj[k] = v;
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(obj, null, 2));
  } catch (err) {
    console.error('Error saving local_db.json:', err.message);
  }
};

mongoose.set('bufferCommands', false);
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, default: 'player' },
  stats: {
    level: { type: Number, default: 1 },
    xp: { type: Number, default: 0 },
    gold: { type: Number, default: 20 },
    hp: { type: Number, default: 100 },
    maxHp: { type: Number, default: 100 },
    baseDamage: { type: Number, default: 8 },
    kills: { type: Number, default: 0 },
    pos: {
      x: { type: Number, default: 0 },
      z: { type: Number, default: 0 }
    }
  },
  equipment: {
    weapon: { type: Object, default: null },
    armor: { type: Object, default: null },
    artifact: { type: Object, default: null }
  },
  inventory: { type: Array, default: [] }
});

const User = mongoose.model('User', userSchema);

module.exports = {
  connect: async () => {
    if (!process.env.MONGODB_URI) {
      console.warn('[AI Studio] MONGODB_URI not provided — using local JSON store for persistence');
      isConnected = false;
      return;
    }
    try {
      await mongoose.connect(process.env.MONGODB_URI, {
        serverSelectionTimeoutMS: 3000
      });
      isConnected = true;
      console.log('Connected to MongoDB Atlas');
    } catch (err) {
      isConnected = false;
      console.warn('[AI Studio] MongoDB not connected — using local JSON store:', err.message);
    }
  },
  getUser: async (username) => {
    if (isConnected) {
      return User.findOne({ username });
    }
    return inMemoryUsers.get(username) || null;
  },
  createUser: async (data) => {
    if (isConnected) {
      return new User(data).save();
    }
    inMemoryUsers.set(data.username, { ...data });
    saveLocalDb();
    return inMemoryUsers.get(data.username);
  },
  saveUser: async (username, data) => {
    if (isConnected) {
      return User.findOneAndUpdate({ username }, data);
    }
    const user = inMemoryUsers.get(username);
    if (user) {
      Object.assign(user, data);
      inMemoryUsers.set(username, user);
      saveLocalDb();
    }
    return user;
  },
  getAllUsers: async () => {
    if (isConnected) {
      return User.find({});
    }
    return Array.from(inMemoryUsers.values());
  },
  freshStats: () => ({
    level: 1, xp: 0, gold: 20, hp: 100, maxHp: 100, baseDamage: 8, kills: 0,
    pos: { x: (Math.random() - 0.5) * 10, z: (Math.random() - 0.5) * 10 }
  })
};