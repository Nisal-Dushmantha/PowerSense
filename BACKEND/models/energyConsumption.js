const mongoose = require('mongoose');

const energyConsumptionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User is required']
    },
    consumption_date: {
        type: Date,
        required: [true, 'Consumption date is required']
    },
    consumption_time: {
        type: String,
        required: false,
        match: [/^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/, 'Please provide a valid time in HH:MM:SS format']
    },
    energy_used_kwh: {
        type: Number,
        required: [true, 'Energy consumption in kWh is required'],
        min: [0, 'Energy consumption cannot be negative']
    },
    period_type: {
        type: String,
        required: [true, 'Period type is required'],
        enum: {
            values: ['hourly', 'daily', 'monthly'],
            message: 'Period type must be one of: hourly, daily, monthly'
        }
    }
}, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
});

// Add compound index for better query performance
energyConsumptionSchema.index({ user: 1, consumption_date: 1, period_type: 1 });

// Pre-save hook to ensure consumption_time is present for hourly period_type
energyConsumptionSchema.pre('save', function(next) {
    if (this.period_type === 'hourly' && !this.consumption_time) {
        throw new Error('consumption_time is required for hourly period_type');
    }
    next();
});

const EnergyConsumption = mongoose.model('EnergyConsumption', energyConsumptionSchema);

module.exports = EnergyConsumption;
