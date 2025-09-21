// utils/likeService.js
const Like = require('../models/Like');

const registerLike = async (stock, hashedIP) => {
  const existing = await Like.findOne({ stock, ip: hashedIP });
  if (!existing) {
    await Like.create({ stock, ip: hashedIP });
  }
};

const getLikes = async (stock) => {
  const count = await Like.countDocuments({ stock });
  return count;
};

module.exports = { registerLike, getLikes };
