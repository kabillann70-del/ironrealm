const mongoose = require('mongoose');

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
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB Atlas");
  },
  getUser: (username) => User.findOne({ username }),
  createUser: (data) => new User(data).save(),
  saveUser: (username, data) => User.findOneAndUpdate({ username }, data),
  getAllUsers: () => User.find({}),
  freshStats: () => ({
    level: 1, xp: 0, gold: 20, hp: 100, maxHp: 100, baseDamage: 8, kills: 0,
    pos: { x: (Math.random() - 0.5) * 10, z: (Math.random() - 0.5) * 10 }
  })
};