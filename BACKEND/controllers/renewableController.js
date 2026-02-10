const RenewableSource = require('../models/RenewableSource');
const RenewableEnergyRecord = require('../models/RenewableEnergyRecord');
const mongoose = require('mongoose');

// ============ RENEWABLE SOURCE CONTROLLERS ============

// @desc    Create a new renewable source
// @route   POST /api/renewable/sources
// @access  Private
const createSource = async (req, res) => {
  try {
    const sourceData = {
      ...req.body,
      user: req.user._id
    };

    const source = await RenewableSource.create(sourceData);
    
    res.status(201).json({
      success: true,
      message: 'Renewable source created successfully',
      data: source
    });
  } catch (error) {
    console.error('Error creating renewable source:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error creating renewable source'
    });
  }
};

// @desc    Get all renewable sources for logged in user
// @route   GET /api/renewable/sources
// @access  Private
const getSources = async (req, res) => {
  try {
    const { status, sourceType, sortBy = '-createdAt' } = req.query;
    
    const query = { user: req.user._id };
    
    if (status) query.status = status;
    if (sourceType) query.sourceType = sourceType;

    const sources = await RenewableSource.find(query).sort(sortBy);
    
    res.status(200).json({
      success: true,
      count: sources.length,
      data: sources
    });
  } catch (error) {
    console.error('Error fetching renewable sources:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching renewable sources'
    });
  }
};

// @desc    Get single renewable source by ID
// @route   GET /api/renewable/sources/:id
// @access  Private
const getSourceById = async (req, res) => {
  try {
    const source = await RenewableSource.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!source) {
      return res.status(404).json({
        success: false,
        message: 'Renewable source not found'
      });
    }

    res.status(200).json({
      success: true,
      data: source
    });
  } catch (error) {
    console.error('Error fetching renewable source:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching renewable source'
    });
  }
};

// @desc    Update renewable source
// @route   PUT /api/renewable/sources/:id
// @access  Private
const updateSource = async (req, res) => {
  try {
    const source = await RenewableSource.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!source) {
      return res.status(404).json({
        success: false,
        message: 'Renewable source not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Renewable source updated successfully',
      data: source
    });
  } catch (error) {
    console.error('Error updating renewable source:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error updating renewable source'
    });
  }
};

// @desc    Delete renewable source
// @route   DELETE /api/renewable/sources/:id
// @access  Private
const deleteSource = async (req, res) => {
  try {
    const source = await RenewableSource.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id
    });

    if (!source) {
      return res.status(404).json({
        success: false,
        message: 'Renewable source not found'
      });
    }

    // Also delete all associated energy records
    await RenewableEnergyRecord.deleteMany({ source: req.params.id });

    res.status(200).json({
      success: true,
      message: 'Renewable source and associated records deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting renewable source:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting renewable source'
    });
  }
};

// ============ ENERGY RECORD CONTROLLERS ============

// @desc    Create a new energy record
// @route   POST /api/renewable/records
// @access  Private
const createRecord = async (req, res) => {
  try {
    // Verify that the source belongs to the user
    const source = await RenewableSource.findOne({
      _id: req.body.source,
      user: req.user._id
    });

    if (!source) {
      return res.status(404).json({
        success: false,
        message: 'Renewable source not found or does not belong to you'
      });
    }

    const recordData = {
      ...req.body,
      user: req.user._id
    };

    const record = await RenewableEnergyRecord.create(recordData);
    
    // Populate source details
    await record.populate('source');
    
    res.status(201).json({
      success: true,
      message: 'Energy record created successfully',
      data: record
    });
  } catch (error) {
    console.error('Error creating energy record:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error creating energy record'
    });
  }
};

// @desc    Get all energy records for logged in user
// @route   GET /api/renewable/records
// @access  Private
const getRecords = async (req, res) => {
  try {
    const { source, startDate, endDate, sortBy = '-recordDate' } = req.query;
    
    const query = { user: req.user._id };
    
    if (source) query.source = source;
    
    if (startDate || endDate) {
      query.recordDate = {};
      if (startDate) query.recordDate.$gte = new Date(startDate);
      if (endDate) query.recordDate.$lte = new Date(endDate);
    }

    const records = await RenewableEnergyRecord.find(query)
      .populate('source', 'sourceName sourceType capacity capacityUnit')
      .sort(sortBy);
    
    res.status(200).json({
      success: true,
      count: records.length,
      data: records
    });
  } catch (error) {
    console.error('Error fetching energy records:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching energy records'
    });
  }
};

// @desc    Get single energy record by ID
// @route   GET /api/renewable/records/:id
// @access  Private
const getRecordById = async (req, res) => {
  try {
    const record = await RenewableEnergyRecord.findOne({
      _id: req.params.id,
      user: req.user._id
    }).populate('source');

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Energy record not found'
      });
    }

    res.status(200).json({
      success: true,
      data: record
    });
  } catch (error) {
    console.error('Error fetching energy record:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching energy record'
    });
  }
};

// @desc    Update energy record
// @route   PUT /api/renewable/records/:id
// @access  Private
const updateRecord = async (req, res) => {
  try {
    const record = await RenewableEnergyRecord.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      { new: true, runValidators: true }
    ).populate('source');

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Energy record not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Energy record updated successfully',
      data: record
    });
  } catch (error) {
    console.error('Error updating energy record:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error updating energy record'
    });
  }
};

// @desc    Delete energy record
// @route   DELETE /api/renewable/records/:id
// @access  Private
const deleteRecord = async (req, res) => {
  try {
    const record = await RenewableEnergyRecord.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id
    });

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Energy record not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Energy record deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting energy record:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting energy record'
    });
  }
};

// ============ STATISTICS CONTROLLERS ============

// @desc    Get renewable energy statistics
// @route   GET /api/renewable/stats
// @access  Private
const getStatistics = async (req, res) => {
  try {
    const { startDate, endDate, sourceId } = req.query;
    
    const matchQuery = { user: req.user._id };
    
    if (sourceId) {
      matchQuery.source = new mongoose.Types.ObjectId(sourceId);
    }
    
    if (startDate || endDate) {
      matchQuery.recordDate = {};
      if (startDate) matchQuery.recordDate.$gte = new Date(startDate);
      if (endDate) matchQuery.recordDate.$lte = new Date(endDate);
    }

    // Total energy statistics
    const totalStats = await RenewableEnergyRecord.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalEnergyGenerated: { $sum: '$energyGenerated' },
          totalCarbonOffset: { $sum: '$carbonOffset' },
          totalCostSavings: { $sum: '$costSavings' },
          averageEfficiency: { $avg: '$efficiency' },
          recordCount: { $sum: 1 }
        }
      }
    ]);

    // Energy by source type
    const energyByType = await RenewableEnergyRecord.aggregate([
      { $match: matchQuery },
      {
        $lookup: {
          from: 'renewablesources',
          localField: 'source',
          foreignField: '_id',
          as: 'sourceInfo'
        }
      },
      { $unwind: '$sourceInfo' },
      {
        $group: {
          _id: '$sourceInfo.sourceType',
          totalEnergy: { $sum: '$energyGenerated' },
          recordCount: { $sum: 1 }
        }
      },
      { $sort: { totalEnergy: -1 } }
    ]);

    // Monthly trends
    const monthlyTrends = await RenewableEnergyRecord.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: {
            year: { $year: '$recordDate' },
            month: { $month: '$recordDate' }
          },
          totalEnergy: { $sum: '$energyGenerated' },
          totalCarbonOffset: { $sum: '$carbonOffset' },
          avgEfficiency: { $avg: '$efficiency' },
          recordCount: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 }
    ]);

    // Top performing sources
    const topSources = await RenewableEnergyRecord.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$source',
          totalEnergy: { $sum: '$energyGenerated' },
          avgEfficiency: { $avg: '$efficiency' },
          recordCount: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'renewablesources',
          localField: '_id',
          foreignField: '_id',
          as: 'sourceInfo'
        }
      },
      { $unwind: '$sourceInfo' },
      {
        $project: {
          sourceName: '$sourceInfo.sourceName',
          sourceType: '$sourceInfo.sourceType',
          totalEnergy: 1,
          avgEfficiency: 1,
          recordCount: 1
        }
      },
      { $sort: { totalEnergy: -1 } },
      { $limit: 5 }
    ]);

    // Get total number of sources
    const totalSources = await RenewableSource.countDocuments({ 
      user: req.user._id,
      ...(sourceId ? { _id: new mongoose.Types.ObjectId(sourceId) } : {})
    });

    res.status(200).json({
      success: true,
      data: {
        summary: totalStats[0] || {
          totalEnergyGenerated: 0,
          totalCarbonOffset: 0,
          totalCostSavings: 0,
          averageEfficiency: 0,
          recordCount: 0
        },
        energyByType,
        monthlyTrends,
        topSources,
        totalSources
      }
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching statistics'
    });
  }
};

// @desc    Get dashboard summary
// @route   GET /api/renewable/dashboard
// @access  Private
const getDashboardSummary = async (req, res) => {
  try {
    const userId = req.user._id;

    // Total sources
    const totalSources = await RenewableSource.countDocuments({ user: userId });
    const activeSources = await RenewableSource.countDocuments({ 
      user: userId, 
      status: 'Active' 
    });

    // Total records
    const totalRecords = await RenewableEnergyRecord.countDocuments({ user: userId });

    // Recent records (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentStats = await RenewableEnergyRecord.aggregate([
      {
        $match: {
          user: userId,
          recordDate: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: null,
          totalEnergy: { $sum: '$energyGenerated' },
          totalCarbonOffset: { $sum: '$carbonOffset' },
          totalCostSavings: { $sum: '$costSavings' },
          avgEfficiency: { $avg: '$efficiency' }
        }
      }
    ]);

    // All-time totals
    const allTimeStats = await RenewableEnergyRecord.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: null,
          totalEnergy: { $sum: '$energyGenerated' },
          totalCarbonOffset: { $sum: '$carbonOffset' },
          totalCostSavings: { $sum: '$costSavings' }
        }
      }
    ]);

    // Latest records
    const latestRecords = await RenewableEnergyRecord.find({ user: userId })
      .populate('source', 'sourceName sourceType')
      .sort('-recordDate')
      .limit(5);

    res.status(200).json({
      success: true,
      data: {
        sources: {
          total: totalSources,
          active: activeSources
        },
        records: totalRecords,
        last30Days: recentStats[0] || {
          totalEnergy: 0,
          totalCarbonOffset: 0,
          totalCostSavings: 0,
          avgEfficiency: 0
        },
        allTime: allTimeStats[0] || {
          totalEnergy: 0,
          totalCarbonOffset: 0,
          totalCostSavings: 0
        },
        latestRecords
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard summary:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard summary'
    });
  }
};

module.exports = {
  // Source controllers
  createSource,
  getSources,
  getSourceById,
  updateSource,
  deleteSource,
  
  // Record controllers
  createRecord,
  getRecords,
  getRecordById,
  updateRecord,
  deleteRecord,
  
  // Statistics controllers
  getStatistics,
  getDashboardSummary
};
