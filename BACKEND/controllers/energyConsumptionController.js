const EnergyConsumption = require('../models/energyConsumption');

// @desc    Create a new energy consumption record
// @route   POST /api/energy-consumption
// @access  Private
exports.createEnergyConsumption = async (req, res) => {
    try {
        const { 
            consumption_date, 
            consumption_time, 
            energy_used_kwh, 
            period_type 
        } = req.body;

        // Create new record with user ID from authentication
        const newRecord = new EnergyConsumption({
            user: req.user.id,
            consumption_date: new Date(consumption_date),
            consumption_time,
            energy_used_kwh: parseFloat(energy_used_kwh),
            period_type
        });

        const savedRecord = await newRecord.save();

        res.status(201).json({
            success: true,
            message: 'Energy consumption record created successfully',
            data: savedRecord
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
        const { startDate, endDate, period_type, id } = req.query;
        const query = { user: req.user.id };

        // If specific ID is requested, add it to query
        if (id) {
            query._id = id;
        }

        if (period_type) query.period_type = period_type;
        
        if (startDate || endDate) {
            query.consumption_date = {};
            if (startDate) query.consumption_date.$gte = new Date(startDate);
            if (endDate) query.consumption_date.$lte = new Date(endDate);
        }

        const records = await EnergyConsumption.find(query)
            .sort({ consumption_date: -1 });

        res.status(200).json({
            success: true,
            count: records.length,
            data: records
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
        const { startDate, endDate, period } = req.query;
        const userId = req.user.id;
        
        const matchQuery = { user: userId };

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
            .select('consumption_date energy_used_kwh period_type');

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

// @desc    Update an energy consumption record
// @route   PUT /api/energy-consumption/:id
// @access  Private
exports.updateEnergyConsumption = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = { ...req.body };

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
