// User — a teacher account. Parents do NOT get accounts in the MVP;
// they only receive WhatsApp absence alerts (see utils/whatsapp.js).
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['teacher', 'admin'], default: 'teacher' },
    schoolName: { type: String, trim: true, default: '' }, // free text, e.g. "GBHS Khairpur"
  },
  { timestamps: true }
);

// Hash the password before saving. Only re-hash when the password field changed.
userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('passwordHash')) return next();
  const salt = await bcrypt.genSalt(10);
  this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
  return next();
});

userSchema.methods.comparePassword = function comparePassword(plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

// Never leak the hash in API responses.
userSchema.methods.toSafeJSON = function toSafeJSON() {
  return {
    id: this._id.toString(),
    name: this.name,
    email: this.email,
    role: this.role,
    schoolName: this.schoolName,
  };
};

module.exports = mongoose.model('User', userSchema);
