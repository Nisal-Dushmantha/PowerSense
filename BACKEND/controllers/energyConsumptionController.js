const EnergyConsumption = require('../models/energyConsumption');

// @desc    Create a new energy consumption record
// @route   POST /api/energy-consumption
// @access  Public
exports.createEnergyConsumption = async (req, res) => {
    try {
        const { 
            consumption_date, 
            consumption_time, 
            energy_used_kwh, 
            period_type 
        } = req.body;

        // Create new record
        const newRecord = new EnergyConsumption({
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

// @desc    Get all energy consumption records
// @route   GET /api/energy-consumption
// @access  Public
exports.getEnergyConsumption = async (req, res) => {
    try {
        const { household_id, startDate, endDate, period_type } = req.query;
        const query = {};

        if (household_id) query.household_id = household_id;
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

// @desc    Get total energy consumption
// @route   GET /api/energy-consumption/total
// @access  Public
exports.getTotalConsumption = async (req, res) => {
    try {
        const { household_id, startDate, endDate } = req.query;
        
        if (!household_id) {
            return res.status(400).json({
                success: false,
                message: 'Household ID is required'
            });
        }

        const result = await EnergyConsumption.getTotalConsumption(household_id, startDate, endDate);

        res.status(200).json({
            success: true,
            data: result
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
// @access  Public
exports.updateEnergyConsumption = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = { ...req.body };

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

        if (!updatedRecord) {
            return res.status(404).json({
                success: false,
                message: 'Energy consumption record not found'
            });
        }

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
// @access  Public
exports.deleteEnergyConsumption = async (req, res) => {
    try {
        const { id } = req.params;
        
        const record = await EnergyConsumption.findByIdAndDelete(id);
        
        if (!record) {
            return res.status(404).json({
                success: false,
                message: 'Energy consumption record not found'
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
