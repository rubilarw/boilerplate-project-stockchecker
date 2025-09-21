const mongoose = require('mongoose');

const LikeSchema = new mongoose.Schema({
  stock: String,
  ip: String
});

module.exports = mongoose.model('Like', LikeSchema);

