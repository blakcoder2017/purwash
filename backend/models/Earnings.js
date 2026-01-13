// models/Earning.js
const EarningSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  amount: Number, // The actual share they received (GHS)
  status: { type: String, enum: ['pending', 'settled'], default: 'pending' }
}, { timestamps: true });

module.exports = mongoose.model('Earning', EarningSchema);