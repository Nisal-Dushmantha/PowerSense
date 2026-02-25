const Device = require('../models/devices');

// Create a new device
exports.createDevice = async (req, res) => {
	try {
		// Ignore deviceId from client, always auto-generate
		const { name, type, powerRating, expectedDailyUsage } = req.body;
		const device = new Device({ name, type, powerRating, expectedDailyUsage });
		await device.save();
		return res.status(201).json(device);
	} catch (error) {
		console.error('createDevice error:', error);
		if (error.code === 11000) {
			return res.status(409).json({ message: 'Device with this deviceId already exists' });
		}
		return res.status(500).json({ message: 'Server error', error: error.message });
	}
};

// Get all devices
exports.getDevices = async (req, res) => {
	try {
		const devices = await Device.find().sort({ createdAt: -1 });
		return res.json(devices);
	} catch (error) {
		console.error('getDevices error:', error);
		return res.status(500).json({ message: 'Server error', error: error.message });
	}
};

// Get device by deviceId
exports.getDeviceById = async (req, res) => {
	try {
		const { deviceId } = req.params;
		const device = await Device.findOne({ deviceId });
		if (!device) return res.status(404).json({ message: 'Device not found' });
		return res.json(device);
	} catch (error) {
		console.error('getDeviceById error:', error);
		return res.status(500).json({ message: 'Server error', error: error.message });
	}
};

// Update device by deviceId
exports.updateDevice = async (req, res) => {
	try {
		const { deviceId } = req.params;
		const updates = (({ name, type, powerRating, expectedDailyUsage }) => ({ name, type, powerRating, expectedDailyUsage }))(req.body);

		const device = await Device.findOneAndUpdate({ deviceId }, { $set: updates }, { new: true, runValidators: true });
		if (!device) return res.status(404).json({ message: 'Device not found' });
		return res.json(device);
	} catch (error) {
		console.error('updateDevice error:', error);
		return res.status(500).json({ message: 'Server error', error: error.message });
	}
};

// Delete device by deviceId or _id
exports.deleteDevice = async (req, res) => {
	try {
		const { deviceId } = req.params;
		// Try by deviceId first
		let device = await Device.findOneAndDelete({ deviceId });
		// If not found, try by _id
		if (!device && deviceId.match(/^[a-fA-F0-9]{24}$/)) {
			device = await Device.findByIdAndDelete(deviceId);
		}
		if (!device) return res.status(404).json({ message: 'Device not found' });
		return res.json({ message: 'Device deleted' });
	} catch (error) {
		console.error('deleteDevice error:', error);
		return res.status(500).json({ message: 'Server error', error: error.message });
	}
};
