const mongoose = require("mongoose");

const earningSchema = mongoose.Schema({
  userId: {
    type: Number,
    index: true
  },
  dateRequested: {
    type: Date,
    default: Date.now
  },
  dateConfirmed : Date,
  amount: Number,
  referralFee: Number,
  referralCount: Number,
  referralThreshold: Number,
},
{
  strictQuery: 'throw'
});
module.exports = mongoose.model("Earning", earningSchema);