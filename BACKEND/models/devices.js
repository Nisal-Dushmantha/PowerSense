const mongoose = require('mongoose');

//auto incrementing device id
const CounterSchema = new mongoose.Schema({ _id: String, seq: Number });
const Counter = mongoose.models.Counter || mongoose.model('Counter', CounterSchema);

const DeviceSchema = new mongoose.Schema({
	deviceId: {
		type: String,
		required: true,
		unique: true,
		index: true,
	},
	name: {
		type: String,
		required: true,
		trim: true,
	},
	type: {
		type: String,
		required: true,
		trim: true,
	},
	powerRating: {
		// in Watts
		type: Number,
		required: true,
		min: 0,
	},
	expectedDailyUsage: {
		// in hours
		type: Number,
		required: true,
		min: 0,
	},
}, {
	timestamps: true,
});

// Virtual properties for energy consumption calculations
DeviceSchema.virtual('dailyW').get(function() {
	return parseFloat((this.powerRating * this.expectedDailyUsage).toFixed(0));
});

DeviceSchema.virtual('monthlyW').get(function() {
	return parseFloat((this.dailyW * 30).toFixed(0));
});

DeviceSchema.virtual('dailyKwh').get(function() {
	return parseFloat((this.dailyW / 1000).toFixed(3));
});

DeviceSchema.virtual('monthlyKwh').get(function() {
	return parseFloat((this.monthlyW / 1000).toFixed(3));
});

// Ensure virtual fields are serialized when converting to JSON(ensure when API return the data)
DeviceSchema.set('toJSON', { virtuals: true });
DeviceSchema.set('toObject', { virtuals: true });

// Auto-increment deviceId as DVC-001, DVC-002, ...
DeviceSchema.pre('validate', async function (next) {
	if (this.isNew && (!this.deviceId || this.deviceId === '')) {
		   try {
			   const counter = await Counter.findByIdAndUpdate(
				   { _id: 'deviceId' },
				   { $inc: { seq: 1 } },
				   { new: true, upsert: true }
			   );
			   const num = counter.seq;
			   this.deviceId = `DVC-${String(num).padStart(3, '0')}`;
		   } catch (err) {
			   return next(err);
		   }
	}
	next();
});

module.exports = mongoose.model('Device', DeviceSchema);
