import mongoose from 'mongoose';

const userWishlistSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    items: [
      {
        service: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'DiscoveryService',
          required: true,
        },
        addedAt: {
          type: Date,
          default: Date.now,
        },
        interestLevel: {
          type: String,
          enum: ['high', 'medium', 'low'],
          default: 'medium',
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

const UserWishlist = mongoose.model('UserWishlist', userWishlistSchema);

export default UserWishlist;

