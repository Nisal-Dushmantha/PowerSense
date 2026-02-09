const mongoose = require('mongoose');

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

// generate a simple unique deviceId if not provided
DeviceSchema.pre('validate', function (next) {
	if (!this.deviceId) {
		this.deviceId = `DEV-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8).toUpperCase()}`;
	}
	next();
});

module.exports = mongoose.model('Device', DeviceSchema);
