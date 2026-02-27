const Device = require('../models/devices');
const PDFDocument = require('pdfkit');

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

// Generate PDF report for devices consumption
exports.generateDevicesPDFReport = async (req, res) => {
	try {
		const devices = await Device.find().sort({ createdAt: -1 });
		
		// Create a new PDF document
		const doc = new PDFDocument({ margin: 50 });
		
		// Set response headers for PDF download
		res.setHeader('Content-Type', 'application/pdf');
		res.setHeader('Content-Disposition', 'attachment; filename="PowerSense_Device_Report.pdf"');
		
		// Pipe the PDF to the response
		doc.pipe(res);
		
		// Add title
		doc.fontSize(20).font('Helvetica-Bold').text('PowerSense Device Consumption Report', { align: 'center' });
		doc.fontSize(12).font('Helvetica').text(`Generated on: ${new Date().toLocaleString()}`, { align: 'center' });
		doc.moveDown(2);
		
		if (devices.length === 0) {
			doc.text('No devices found in the system.', { align: 'center' });
		} else {
			// Calculate totals
			const totalDailyW = devices.reduce((sum, device) => sum + device.dailyW, 0);
			const totalMonthlyW = devices.reduce((sum, device) => sum + device.monthlyW, 0);
			const totalDailyKwh = devices.reduce((sum, device) => sum + device.dailyKwh, 0);
			const totalMonthlyKwh = devices.reduce((sum, device) => sum + device.monthlyKwh, 0);
			
			// Summary section
			doc.fontSize(16).font('Helvetica-Bold').text('Summary', { underline: true });
			doc.moveDown();
			doc.fontSize(12).font('Helvetica');
			doc.text(`Total Devices: ${devices.length}`);
			doc.text(`Total Daily Consumption: ${totalDailyW.toFixed(0)} W (${totalDailyKwh.toFixed(3)} kWh)`);
			doc.text(`Total Monthly Consumption: ${totalMonthlyW.toFixed(0)} W (${totalMonthlyKwh.toFixed(3)} kWh)`);
			doc.moveDown(2);
			
			// Device details section
			doc.fontSize(16).font('Helvetica-Bold').text('Device Details', { underline: true });
			doc.moveDown();
			
			devices.forEach((device, index) => {
				// Check if we need a new page
				if (doc.y > 700) {
					doc.addPage();
				}
				
				doc.fontSize(14).font('Helvetica-Bold').text(`${index + 1}. ${device.name} (${device.deviceId})`);
				doc.fontSize(11).font('Helvetica');
				doc.text(`Type: ${device.type}`);
				doc.text(`Power Rating: ${device.powerRating} W`);
				doc.text(`Expected Daily Usage: ${device.expectedDailyUsage} hours`);
				doc.text(`Daily Consumption: ${device.dailyW} W (${device.dailyKwh} kWh)`);
				doc.text(`Monthly Consumption: ${device.monthlyW} W (${device.monthlyKwh} kWh)`);
				doc.text(`Created: ${device.createdAt.toLocaleString()}`);
				doc.moveDown();
			});
			
			// Device type summary
			const deviceTypes = {};
			devices.forEach(device => {
				if (!deviceTypes[device.type]) {
					deviceTypes[device.type] = {
						count: 0,
						totalDailyW: 0,
						totalMonthlyW: 0,
						totalDailyKwh: 0,
						totalMonthlyKwh: 0
					};
				}
				deviceTypes[device.type].count++;
				deviceTypes[device.type].totalDailyW += device.dailyW;
				deviceTypes[device.type].totalMonthlyW += device.monthlyW;
				deviceTypes[device.type].totalDailyKwh += device.dailyKwh;
				deviceTypes[device.type].totalMonthlyKwh += device.monthlyKwh;
			});
			
			doc.addPage();
			doc.fontSize(16).font('Helvetica-Bold').text('Consumption by Device Type', { underline: true });
			doc.moveDown();
			
			Object.entries(deviceTypes).forEach(([type, data]) => {
				doc.fontSize(14).font('Helvetica-Bold').text(`${type} (${data.count} devices)`);
				doc.fontSize(11).font('Helvetica');
				doc.text(`Daily: ${data.totalDailyW.toFixed(0)} W (${data.totalDailyKwh.toFixed(3)} kWh)`);
				doc.text(`Monthly: ${data.totalMonthlyW.toFixed(0)} W (${data.totalMonthlyKwh.toFixed(3)} kWh)`);
				doc.moveDown();
			});
		}
		
		// Footer
		doc.fontSize(8).text('Generated by PowerSense Energy Management System', 50, doc.page.height - 50, { align: 'center' });
		
		// Finalize the PDF
		doc.end();
		
	} catch (error) {
		console.error('generateDevicesPDFReport error:', error);
		return res.status(500).json({ message: 'Server error', error: error.message });
	}
};
