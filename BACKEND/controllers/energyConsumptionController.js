const EnergyConsumption = require('../models/energyConsumption');
const mongoose = require('mongoose');
const Device = require('../models/devices');
const MonthlyBill = require('../models/monthlyBill');
const RenewableEnergyRecord = require('../models/RenewableEnergyRecord');
const User = require('../models/User');
const whatsappService = require('../services/energyWhatsAppService');

const triggerAutoThresholdWhatsAppAlert = async ({ userId, record }) => {
    try {
        const user = await User.findById(userId).select('firstName lastName contactNumber energyThreshold');

        if (!user) {
            return { attempted: false, sent: false, reason: 'user_not_found' };
        }

        if (user.energyThreshold == null) {
            return { attempted: false, sent: false, reason: 'threshold_not_configured' };
        }

        if (!user.contactNumber) {
            return { attempted: false, sent: false, reason: 'contact_number_not_set' };
        }

        const reading = Number(record.energy_used_kwh || 0);
        const threshold = Number(user.energyThreshold);

        if (reading <= threshold) {
            return { attempted: false, sent: false, reason: 'threshold_not_exceeded' };
        }

        if (!whatsappService.isEnabled()) {
            return { attempted: true, sent: false, reason: 'whatsapp_disabled' };
        }

        const waStatus = whatsappService.getStatus();
        if (!waStatus.ready) {
            if (!waStatus.initializing) {
                whatsappService.start().catch(() => null);
            }
            return { attempted: true, sent: false, reason: 'whatsapp_not_ready' };
        }

        const exceededBy = Number((reading - threshold).toFixed(2));
        const message = [
            `🔔 PowerSense Auto Alert - ${user.firstName} ${user.lastName}`,
            '',
            `Your latest reading exceeded threshold.`,
            `Reading: ${reading.toFixed(2)} kWh`,
            `Threshold: ${threshold.toFixed(2)} kWh`,
            `Exceeded by: +${exceededBy.toFixed(2)} kWh`,
            `Meter: ${record.meter_id || 'N/A'}`,
            `Date: ${new Date(record.consumption_date).toLocaleDateString('en-GB')}`,
            '',
            'Tip: Review Threshold Alerts in PowerSense Analytics.'
        ].join('\n');

        const sent = await whatsappService.sendMessage(user.contactNumber, message);
        return { attempted: true, sent: true, reason: null, sentInfo: sent };
    } catch (error) {
        return { attempted: true, sent: false, reason: 'send_failed', error: error.message };
    }
};

// @desc    Create a new energy consumption record
// @route   POST /api/energy-consumption
// @access  Private
exports.createEnergyConsumption = async (req, res) => {
    try {
        const { 
            consumption_date, 
            consumption_time, 
            energy_used_kwh, 
            period_type,
            device 
        } = req.body;

        let linkedDevice = null;
        if (device) {
            linkedDevice = await Device.findOne({ _id: device, user: req.user.id }).select('_id');
            if (!linkedDevice) {
                return res.status(400).json({
                    success: false,
                    message: 'Selected device is invalid or not owned by you'
                });
            }
        }

        // Create new record with user ID from authentication
        const newRecord = new EnergyConsumption({
            user: req.user.id,
            device: linkedDevice?._id,
            consumption_date: new Date(consumption_date),
            consumption_time,
            energy_used_kwh: parseFloat(energy_used_kwh),
            period_type
        });

        const savedRecord = await newRecord.save();
        const alertStatus = await triggerAutoThresholdWhatsAppAlert({ userId: req.user.id, record: savedRecord });

        res.status(201).json({
            success: true,
            message: 'Energy consumption record created successfully',
            data: savedRecord,
            notifications: {
                thresholdAlert: alertStatus
            }
        });
    } catch (error) {
        console.error('Error creating energy consumption record:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Get all energy consumption records for the authenticated user
// @route   GET /api/energy-consumption
// @access  Private
exports.getEnergyConsumption = async (req, res) => {
    try {
        const { startDate, endDate, period_type, id, deviceId, search, page = 1, limit = 500 } = req.query;
        const query = { user: req.user.id };

        // If specific ID is requested, add it to query
        if (id) {
            query._id = id;
        }

        if (period_type) query.period_type = period_type;
        if (deviceId && mongoose.Types.ObjectId.isValid(deviceId)) {
            query.device = new mongoose.Types.ObjectId(deviceId);
        }

        if (search) {
            query.meter_id = { $regex: search, $options: 'i' };
        }
        
        if (startDate || endDate) {
            query.consumption_date = {};
            if (startDate) query.consumption_date.$gte = new Date(startDate);
            if (endDate) query.consumption_date.$lte = new Date(endDate);
        }

        const safePage = Math.max(parseInt(page, 10) || 1, 1);
        const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 1000);
        const skip = (safePage - 1) * safeLimit;

        const [records, total] = await Promise.all([
            EnergyConsumption.find(query)
                .populate('device', 'deviceId name type powerRating expectedDailyUsage')
                .sort({ consumption_date: -1 })
                .skip(skip)
                .limit(safeLimit),
            EnergyConsumption.countDocuments(query)
        ]);

        res.status(200).json({
            success: true,
            count: records.length,
            data: records,
            pagination: {
                page: safePage,
                limit: safeLimit,
                total,
                totalPages: Math.ceil(total / safeLimit)
            }
        });
    } catch (error) {
        console.error('Error fetching energy consumption records:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Get total energy consumption for the authenticated user
// @route   GET /api/energy-consumption/total
// @access  Private
exports.getTotalConsumption = async (req, res) => {
    try {
        const { startDate, endDate, period, period_type } = req.query;
        const userId = req.user.id;
        
        const matchQuery = { user: userId };
        const resolvedPeriodType = period_type || period;

        if (resolvedPeriodType) {
            matchQuery.period_type = resolvedPeriodType;
        }

        // Add date range filter if provided
        if (startDate && endDate) {
            matchQuery.consumption_date = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        // Aggregate pipeline to calculate total consumption
        const result = await EnergyConsumption.aggregate([
            { $match: matchQuery },
            {
                $group: {
                    _id: null,
                    total_consumption: { $sum: '$energy_used_kwh' },
                    count: { $sum: 1 },
                    average_daily: { $avg: '$energy_used_kwh' }
                }
            }
        ]);

        // Get individual records for the chart data
        const records = await EnergyConsumption.find(matchQuery)
            .sort({ consumption_date: 1 })
            .select('consumption_date energy_used_kwh period_type meter_id device')
            .populate('device', 'deviceId name type');

        const responseData = {
            total_consumption: result.length > 0 ? result[0].total_consumption : 0,
            average_daily: result.length > 0 ? result[0].average_daily : 0,
            count: result.length > 0 ? result[0].count : 0,
            data: records
        };

        res.status(200).json({
            success: true,
            data: responseData
        });
    } catch (error) {
        console.error('Error calculating total energy consumption:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Get compact summary for consumption dashboard
// @route   GET /api/energy-consumption/summary
// @access  Private
exports.getConsumptionSummary = async (req, res) => {
    try {
        const userId = new mongoose.Types.ObjectId(req.user.id);
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const thirtyDaysAgo = new Date(now);
        thirtyDaysAgo.setDate(now.getDate() - 30);

        const [allTime, currentMonth, lastRecord, rolling30d] = await Promise.all([
            EnergyConsumption.aggregate([
                { $match: { user: userId } },
                {
                    $group: {
                        _id: null,
                        totalRecords: { $sum: 1 },
                        totalKwh: { $sum: '$energy_used_kwh' },
                        averageKwh: { $avg: '$energy_used_kwh' }
                    }
                }
            ]),
            EnergyConsumption.aggregate([
                {
                    $match: {
                        user: userId,
                        consumption_date: { $gte: monthStart }
                    }
                },
                {
                    $group: {
                        _id: null,
                        monthKwh: { $sum: '$energy_used_kwh' },
                        monthCount: { $sum: 1 }
                    }
                }
            ]),
            EnergyConsumption.findOne({ user: userId })
                .sort({ consumption_date: -1 })
                .select('consumption_date energy_used_kwh period_type meter_id'),
            EnergyConsumption.aggregate([
                {
                    $match: {
                        user: userId,
                        consumption_date: { $gte: thirtyDaysAgo }
                    }
                },
                {
                    $group: {
                        _id: {
                            y: { $year: '$consumption_date' },
                            m: { $month: '$consumption_date' },
                            d: { $dayOfMonth: '$consumption_date' }
                        },
                        dailyTotal: { $sum: '$energy_used_kwh' }
                    }
                },
                {
                    $group: {
                        _id: null,
                        avgDaily30d: { $avg: '$dailyTotal' }
                    }
                }
            ])
        ]);

        const allTimeData = allTime[0] || { totalRecords: 0, totalKwh: 0, averageKwh: 0 };
        const currentMonthData = currentMonth[0] || { monthKwh: 0, monthCount: 0 };

        res.status(200).json({
            success: true,
            message: 'Consumption summary fetched successfully',
            data: {
                totalRecords: allTimeData.totalRecords,
                totalKwh: Number(allTimeData.totalKwh.toFixed(2)),
                averageKwh: Number((allTimeData.averageKwh || 0).toFixed(2)),
                thisMonthKwh: Number(currentMonthData.monthKwh.toFixed(2)),
                thisMonthRecords: currentMonthData.monthCount,
                avgDaily30d: Number((rolling30d[0]?.avgDaily30d || 0).toFixed(2)),
                lastReading: lastRecord
                    ? {
                        date: lastRecord.consumption_date,
                        kwh: lastRecord.energy_used_kwh,
                        periodType: lastRecord.period_type,
                        meterId: lastRecord.meter_id
                    }
                    : null
            }
        });
    } catch (error) {
        console.error('Error fetching consumption summary:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Get cross-component integration stats for energy monitoring
// @route   GET /api/energy-consumption/integration
// @access  Private
exports.getConsumptionIntegration = async (req, res) => {
    try {
        const userId = new mongoose.Types.ObjectId(req.user.id);
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

        const [
            linkedByDevice,
            devices,
            monthlyConsumption,
            monthlyRenewable,
            billsMonth,
            recentRecords
        ] = await Promise.all([
            EnergyConsumption.aggregate([
                { $match: { user: userId, device: { $ne: null } } },
                {
                    $group: {
                        _id: '$device',
                        totalKwh: { $sum: '$energy_used_kwh' },
                        records: { $sum: 1 }
                    }
                },
                {
                    $lookup: {
                        from: 'devices',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'device'
                    }
                },
                { $unwind: { path: '$device', preserveNullAndEmptyArrays: true } },
                {
                    $project: {
                        _id: 0,
                        deviceId: '$device.deviceId',
                        deviceName: '$device.name',
                        deviceType: '$device.type',
                        linkedKwh: { $round: ['$totalKwh', 2] },
                        linkedRecords: '$records'
                    }
                },
                { $sort: { linkedKwh: -1 } }
            ]),
            Device.find({ user: userId }).select('deviceId name type monthlyKwh dailyKwh'),
            EnergyConsumption.aggregate([
                {
                    $match: {
                        user: userId,
                        consumption_date: { $gte: monthStart, $lt: monthEnd }
                    }
                },
                {
                    $group: {
                        _id: null,
                        totalKwh: { $sum: '$energy_used_kwh' }
                    }
                }
            ]),
            RenewableEnergyRecord.aggregate([
                {
                    $match: {
                        user: userId,
                        recordDate: { $gte: monthStart, $lt: monthEnd }
                    }
                },
                {
                    $group: {
                        _id: null,
                        totalKwh: {
                            $sum: {
                                $cond: [
                                    { $eq: ['$energyUnit', 'MWh'] },
                                    { $multiply: ['$energyGenerated', 1000] },
                                    {
                                        $cond: [
                                            { $eq: ['$energyUnit', 'GWh'] },
                                            { $multiply: ['$energyGenerated', 1000000] },
                                            '$energyGenerated'
                                        ]
                                    }
                                ]
                            }
                        }
                    }
                }
            ]),
            MonthlyBill.aggregate([
                {
                    $match: {
                        user: userId,
                        billIssueDate: { $gte: monthStart, $lt: monthEnd }
                    }
                },
                {
                    $group: {
                        _id: null,
                        billedKwh: { $sum: '$totalKWh' },
                        billedAmount: { $sum: '$totalPayment' }
                    }
                }
            ]),
            EnergyConsumption.find({ user: userId })
                .sort({ consumption_date: -1 })
                .limit(10)
                .select('consumption_date energy_used_kwh period_type meter_id device')
        ]);

        const estimatedByDevice = devices
            .map((device) => ({
                deviceId: device.deviceId,
                deviceName: device.name,
                deviceType: device.type,
                estimatedMonthlyKwh: Number((device.monthlyKwh || 0).toFixed(2)),
                estimatedDailyKwh: Number((device.dailyKwh || 0).toFixed(2))
            }))
            .sort((a, b) => b.estimatedMonthlyKwh - a.estimatedMonthlyKwh);

        const consumptionMonthKwh = monthlyConsumption[0]?.totalKwh || 0;
        const renewableMonthKwh = monthlyRenewable[0]?.totalKwh || 0;
        const billedKwh = billsMonth[0]?.billedKwh || 0;
        const billedAmount = billsMonth[0]?.billedAmount || 0;
        const linkedRecordsCount = linkedByDevice.reduce((sum, item) => sum + item.linkedRecords, 0);
        const recentLinkedCount = recentRecords.filter((record) => Boolean(record.device)).length;
        const integrationCoverage = recentRecords.length
            ? Number(((recentLinkedCount / recentRecords.length) * 100).toFixed(1))
            : 0;

        res.status(200).json({
            success: true,
            message: 'Energy integration metrics fetched successfully',
            data: {
                overview: {
                    thisMonthConsumptionKwh: Number(consumptionMonthKwh.toFixed(2)),
                    thisMonthRenewableKwh: Number(renewableMonthKwh.toFixed(2)),
                    thisMonthNetGridKwh: Number(Math.max(0, consumptionMonthKwh - renewableMonthKwh).toFixed(2)),
                    thisMonthBilledKwh: Number(billedKwh.toFixed(2)),
                    thisMonthBilledAmount: Number(billedAmount.toFixed(2))
                },
                links: {
                    linkedDeviceRecords: linkedRecordsCount,
                    recentCoveragePercent: integrationCoverage,
                    linkedByDevice
                },
                deviceEstimates: estimatedByDevice.slice(0, 6)
            }
        });
    } catch (error) {
        console.error('Error fetching integration metrics:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Update an energy consumption record
// @route   PUT /api/energy-consumption/:id
// @access  Private
exports.updateEnergyConsumption = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = { ...req.body };

        // Prevent meter_id from being changed
        delete updateData.meter_id;

        // Ensure the user can only update their own records
        const existingRecord = await EnergyConsumption.findOne({ 
            _id: id, 
            user: req.user.id 
        });

        if (!existingRecord) {
            return res.status(404).json({
                success: false,
                message: 'Energy consumption record not found or you do not have permission to update it'
            });
        }

        // Convert date string to Date object if provided
        if (updateData.consumption_date) {
            updateData.consumption_date = new Date(updateData.consumption_date);
        }

        // Convert energy_used_kwh to number if provided
        if (updateData.energy_used_kwh) {
            updateData.energy_used_kwh = parseFloat(updateData.energy_used_kwh);
        }

        const updatedRecord = await EnergyConsumption.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            message: 'Energy consumption record updated successfully',
            data: updatedRecord
        });
    } catch (error) {
        console.error('Error updating energy consumption record:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Delete an energy consumption record
// @route   DELETE /api/energy-consumption/:id
// @access  Private
exports.deleteEnergyConsumption = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Ensure the user can only delete their own records
        const record = await EnergyConsumption.findOneAndDelete({ 
            _id: id, 
            user: req.user.id 
        });
        
        if (!record) {
            return res.status(404).json({
                success: false,
                message: 'Energy consumption record not found or you do not have permission to delete it'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Energy consumption record deleted successfully',
            data: {}
        });
    } catch (error) {
        console.error('Error deleting energy consumption record:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};
