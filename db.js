const mongoose = require('mongoose');

let isConnected = false;
const inMemoryUsers = new Map();

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
      console.warn('[AI Studio] MONGODB_URI not provided — using in-memory store');
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
      console.warn('[AI Studio] MongoDB not connected — using in-memory mock store:', err.message);
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