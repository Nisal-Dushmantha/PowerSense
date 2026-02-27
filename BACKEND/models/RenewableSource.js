const mongoose = require('mongoose');

const renewableSourceSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },
  sourceName: {
    type: String,
    required: [true, 'Source name is required'],
    trim: true
  },
  sourceType: {
    type: String,
    required: [true, 'Source type is required'],
    enum: {
      values: ['Solar', 'Wind', 'Hydro', 'Biomass', 'Geothermal', 'Other'],
      message: '{VALUE} is not a valid source type'
    }
  },
  capacity: {
    type: Number,
    required: [true, 'Capacity is required'],
    min: [0, 'Capacity cannot be negative']
  },
  capacityUnit: {
    type: String,
    enum: ['kW', 'MW', 'GW'],
    default: 'kW'
  },
  installationDate: {
    type: Date,
    required: [true, 'Installation date is required']
  },
  location: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Maintenance'],
    default: 'Active'
  },
  description: {
    type: String,
    trim: true
  },
  estimatedAnnualProduction: {
    type: Number,
    min: [0, 'Estimated annual production cannot be negative']
  },
  manufacturer: {
    type: String,
    trim: true
  },
  warrantyExpiry: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for faster queries
renewableSourceSchema.index({ user: 1, sourceType: 1 });
renewableSourceSchema.index({ user: 1, status: 1 });

// Virtual for age in days
renewableSourceSchema.virtual('ageInDays').get(function() {
  return Math.floor((Date.now() - this.installationDate) / (1000 * 60 * 60 * 24));
});

// Virtual for checking if warranty is valid
renewableSourceSchema.virtual('isWarrantyValid').get(function() {
  if (!this.warrantyExpiry) return null;
  return this.warrantyExpiry > new Date();
});

// Ensure virtuals are included in JSON
renewableSourceSchema.set('toJSON', { virtuals: true });
renewableSourceSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('RenewableSource', renewableSourceSchema);
