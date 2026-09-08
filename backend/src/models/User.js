import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true
    },
    // Password is only required for local email/password signups
    password: {
      type: String,
      required: function () {
        return !this.googleId && !this.facebookId && !this.discordId;
      },
      minlength: [6, 'Password must be at least 6 characters']
    },
    // OAuth Providers
    googleId: {
      type: String,
      default: null,
      sparse: true
    },
    facebookId: {
      type: String,
      default: null,
      sparse: true
    },
    discordId: {
      type: String,
      default: null,
      sparse: true
    },
    avatar: {
      type: String,
      default: null
    },
    authProvider: {
      type: String,
      enum: ['local', 'google', 'facebook', 'discord'],
      default: 'local'
    },
    phone: {
      type: String,
      default: null
    },
    totalBillsScanned: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

const User = mongoose.model('User', userSchema);

export default User;