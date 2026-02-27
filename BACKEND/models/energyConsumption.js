const mongoose = require('mongoose');

const CounterSchema = new mongoose.Schema({ _id: String, seq: Number });
const Counter = mongoose.models.Counter || mongoose.model('Counter', CounterSchema);

const energyConsumptionSchema = new mongoose.Schema({
    meter_id: {
        type: String,
        unique: true,
        index: true,
    },
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
        min: [0.01, 'Energy consumption must be at least 0.01 kWh'],
        max: [99999, 'Energy consumption cannot exceed 99,999 kWh']
    },
    period_type: {
        type: String,
        required: [true, 'Period type is required'],
        enum: {
            values: ['hourly', 'daily', 'weekly', 'monthly'],
            message: 'Period type must be one of: hourly, daily, weekly, monthly'
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

// Auto-increment meter_id as MTR-001, MTR-002, ...
energyConsumptionSchema.pre('validate', async function (next) {
    if (this.isNew && (!this.meter_id || this.meter_id === '')) {
        try {
            const counter = await Counter.findByIdAndUpdate(
                { _id: 'meter_id' },
                { $inc: { seq: 1 } },
                { new: true, upsert: true }
            );
            this.meter_id = `MTR-${String(counter.seq).padStart(3, '0')}`;
        } catch (err) {
            return next(err);
        }
    }
    next();
});

// Pre-save hook to ensure consumption_time is present for hourly period_type
energyConsumptionSchema.pre('save', function(next) {
    if (this.period_type === 'hourly' && !this.consumption_time) {
        throw new Error('consumption_time is required for hourly period_type');
    }
    next();
});

const EnergyConsumption = mongoose.model('EnergyConsumption', energyConsumptionSchema);

module.exports = EnergyConsumption;
