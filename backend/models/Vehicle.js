const mongoose = require('mongoose');

const VehicleSchema = new mongoose.Schema({
  registrationNumber: { type: String, required: true, unique: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver', required: true },
  vehicleType: { type: String, enum: ['Car', 'Bike', 'Other'], required: true },
  make: { type: String },
  model: { type: String, required: true },
  year: { type: Number },
  registrationDate: { type: Date, required: true, default: Date.now },
  registrationExpiry: { type: Date },
  insurance: {
    company: String,
    policyNumber: String,
    expiry: Date
  },
  taxExpiry: { type: Date },
  status: { type: String, enum: ['active','inactive','suspended'], default: 'active' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Vehicle', VehicleSchema);
