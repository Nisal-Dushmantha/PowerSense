const mongoose = require('mongoose');

const energyConsumptionSchema = new mongoose.Schema({
    household_id: {
        type: String,
        default: () => new mongoose.Types.ObjectId().toString(),
        index: true
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
energyConsumptionSchema.index({ household_id: 1, consumption_date: 1, period_type: 1 }, { unique: true });

// Pre-save hook to ensure consumption_time is present for hourly period_type
energyConsumptionSchema.pre('save', function(next) {
    if (this.period_type === 'hourly' && !this.consumption_time) {
        throw new Error('consumption_time is required for hourly period_type');
    }
    next();
});

// Static method to get total consumption for a household
energyConsumptionSchema.statics.getTotalConsumption = async function(household_id, startDate, endDate) {
    const matchQuery = { household_id };
    
    if (startDate || endDate) {
        matchQuery.consumption_date = {};
        if (startDate) matchQuery.consumption_date.$gte = new Date(startDate);
        if (endDate) matchQuery.consumption_date.$lte = new Date(endDate);
    }

    const result = await this.aggregate([
        { $match: matchQuery },
        {
            $group: {
                _id: null,
                total_energy_used: { $sum: '$energy_used_kwh' },
                average_daily_usage: { $avg: '$energy_used_kwh' },
                record_count: { $sum: 1 }
            }
        }
    ]);

    return result[0] || { total_energy_used: 0, average_daily_usage: 0, record_count: 0 };
};

const EnergyConsumption = mongoose.model('EnergyConsumption', energyConsumptionSchema);

module.exports = EnergyConsumption;
