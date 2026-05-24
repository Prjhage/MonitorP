const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  companyName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  // Org the user belongs to (null for legacy users — migrated on first login)
  orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', default: null },
  role: {
    type: String,
    enum: ['owner', 'admin', 'member', 'viewer'],
    default: 'owner'
  },
  createdAt: { type: Date, default: Date.now }
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.index({ orgId: 1 });

module.exports = mongoose.model('User', userSchema);
