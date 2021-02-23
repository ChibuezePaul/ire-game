const mongoose = require("mongoose");

const settingSchema = mongoose.Schema({
  name: {
    type: String,
    unique: true
  },
  value: {
    type: String,
    required: [true, 'Value is required!']
  },
  createdOn: {
    type: Date,
    default: Date.now
  },
  updatedOn : {
    type: Date
  },
  audits: Array
},
{
  strictQuery: 'throw'
});
module.exports = mongoose.model("Setting", settingSchema);