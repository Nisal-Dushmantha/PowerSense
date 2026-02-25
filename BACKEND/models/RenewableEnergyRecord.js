const mongoose = require('mongoose');

const renewableEnergyRecordSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },
  source: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RenewableSource',
    required: [true, 'Renewable source is required']
  },
  recordDate: {
    type: Date,
    required: [true, 'Record date is required'],
    default: Date.now
  },
  energyGenerated: {
    type: Number,
    required: [true, 'Energy generated is required'],
    min: [0, 'Energy generated cannot be negative']
  },
  energyUnit: {
    type: String,
    enum: ['kWh', 'MWh', 'GWh'],
    default: 'kWh'
  },
  peakPower: {
    type: Number,
    min: [0, 'Peak power cannot be negative']
  },
  averagePower: {
    type: Number,
    min: [0, 'Average power cannot be negative']
  },
  operatingHours: {
    type: Number,
    min: [0, 'Operating hours cannot be negative'],
    max: [24, 'Operating hours cannot exceed 24 hours per day']
  },
  efficiency: {
    type: Number,
    min: [0, 'Efficiency cannot be negative'],
    max: [100, 'Efficiency cannot exceed 100%']
  },
  weatherCondition: {
    type: String,
    enum: ['Sunny', 'Cloudy', 'Rainy', 'Windy', 'Stormy', 'Foggy', 'Mixed', 'Other'],
    default: 'Other'
  },
  temperature: {
    type: Number
  },
  carbonOffset: {
    type: Number,
    min: [0, 'Carbon offset cannot be negative'],
    default: function() {
      // Average CO2 emission factor: 0.92 lbs per kWh (around 0.42 kg per kWh)
      return this.energyGenerated * 0.42;
    }
  },
  costSavings: {
    type: Number,
    min: [0, 'Cost savings cannot be negative']
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  maintenancePerformed: {
    type: Boolean,
    default: false
  },
  issues: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Indexes for better query performance
renewableEnergyRecordSchema.index({ user: 1, recordDate: -1 });
renewableEnergyRecordSchema.index({ source: 1, recordDate: -1 });
renewableEnergyRecordSchema.index({ user: 1, source: 1 });

// Pre-save middleware to calculate carbon offset if not provided
renewableEnergyRecordSchema.pre('save', function(next) {
  if (!this.carbonOffset && this.energyGenerated) {
    this.carbonOffset = this.energyGenerated * 0.42; // kg CO2
  }
  next();
});

// Virtual for converting energy to standard unit (kWh)
renewableEnergyRecordSchema.virtual('energyInKWh').get(function() {
  switch (this.energyUnit) {
    case 'MWh':
      return this.energyGenerated * 1000;
    case 'GWh':
      return this.energyGenerated * 1000000;
    default:
      return this.energyGenerated;
  }
});

// Ensure virtuals are included in JSON
renewableEnergyRecordSchema.set('toJSON', { virtuals: true });
renewableEnergyRecordSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('RenewableEnergyRecord', renewableEnergyRecordSchema);
