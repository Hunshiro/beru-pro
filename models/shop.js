const mongoose = require('mongoose');

const shopSchema = new mongoose.Schema({
  roleName: String,
  price: Number,
  roleId: String
});

module.exports = mongoose.model('ShopItem', shopSchema);
