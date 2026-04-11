const RenewableSource = require('../models/RenewableSource');
const RenewableEnergyRecord = require('../models/RenewableEnergyRecord');
const RenewableMaintenanceTask = require('../models/RenewableMaintenanceTask');
const mongoose = require('mongoose');
const axios = require('axios');
const { syncMaintenanceTaskStatuses } = require('../services/maintenanceScheduler');

const getForecastHorizonDays = (period) => {
  const periodMap = {
    '7d': 7,
    '30d': 30
  };

  return periodMap[period] || 7;
};

const calculateMovingAverageSeries = (values, windowSize) => {
  const result = [];
  for (let index = 0; index < values.length; index += 1) {
    const start = Math.max(0, index - windowSize + 1);
    const window = values.slice(start, index + 1);
    const avg = window.reduce((sum, value) => sum + value, 0) / window.length;
    result.push(avg);
  }
  return result;
};

const calculateLinearTrendSlope = (values) => {
  if (values.length < 2) return 0;

  const n = values.length;
  const xMean = (n - 1) / 2;
  const yMean = values.reduce((sum, value) => sum + value, 0) / n;

  let numerator = 0;
  let denominator = 0;

  for (let i = 0; i < n; i += 1) {
    const xDiff = i - xMean;
    numerator += xDiff * (values[i] - yMean);
    denominator += xDiff * xDiff;
  }

  return denominator === 0 ? 0 : numerator / denominator;
};

const calculateStandardDeviation = (values) => {
  if (!values.length) return 0;
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
};

const getStartOfToday = () => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
};

const getVariancePeriodDays = (period) => {
  const map = {
    '30d': 30,
    '90d': 90,
    '1y': 365
  };

  return map[period] || 30;
};

const mapWeatherCodeToLabel = (code) => {
  const weatherMap = {
    0: 'Clear sky',
    1: 'Mainly clear',
    2: 'Partly cloudy',
    3: 'Overcast',
    45: 'Fog',
    48: 'Rime fog',
    51: 'Light drizzle',
    53: 'Moderate drizzle',
    55: 'Dense drizzle',
    61: 'Slight rain',
    63: 'Moderate rain',
    65: 'Heavy rain',
    71: 'Slight snow',
    73: 'Moderate snow',
    75: 'Heavy snow',
    95: 'Thunderstorm'
  };

  return weatherMap[code] || 'Unknown';
};

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
      if (mongoose.Types.ObjectId.isValid(sourceId)) {
        matchQuery.source = new mongoose.Types.ObjectId(sourceId);
      }
    }
    
    if (startDate || endDate) {
      matchQuery.recordDate = {};
      if (startDate && !isNaN(Date.parse(startDate))) {
        matchQuery.recordDate.$gte = new Date(startDate);
      }
      if (endDate && !isNaN(Date.parse(endDate))) {
        matchQuery.recordDate.$lte = new Date(endDate);
      }
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

// @desc    Get generation meters monitoring data
// @route   GET /api/renewable/meters
// @access  Private
const getGenerationMeters = async (req, res) => {
  try {
    const userId = req.user._id;
    const { sourceId, period = '24h' } = req.query;

    const query = { user: userId };
    if (sourceId) query.source = new mongoose.Types.ObjectId(sourceId);

    // Calculate date range based on period
    const now = new Date();
    let startDate = new Date();
    
    switch (period) {
      case '24h':
        startDate.setHours(now.getHours() - 24);
        break;
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      default:
        startDate.setHours(now.getHours() - 24);
    }

    query.recordDate = { $gte: startDate };

    // Get real-time generation data
    const meterData = await RenewableEnergyRecord.aggregate([
      { $match: query },
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
          _id: '$source',
          sourceName: { $first: '$sourceInfo.sourceName' },
          sourceType: { $first: '$sourceInfo.sourceType' },
          capacity: { $first: '$sourceInfo.capacity' },
          capacityUnit: { $first: '$sourceInfo.capacityUnit' },
          currentGeneration: { $last: '$energyGenerated' },
          totalGeneration: { $sum: '$energyGenerated' },
          averageGeneration: { $avg: '$energyGenerated' },
          peakGeneration: { $max: '$energyGenerated' },
          currentEfficiency: { $last: '$efficiency' },
          averageEfficiency: { $avg: '$efficiency' },
          operatingTime: { $sum: '$operatingHours' },
          lastUpdate: { $max: '$recordDate' },
          recordCount: { $sum: 1 }
        }
      },
      {
        $project: {
          sourceName: 1,
          sourceType: 1,
          capacity: 1,
          capacityUnit: 1,
          currentGeneration: 1,
          totalGeneration: 1,
          averageGeneration: 1,
          peakGeneration: 1,
          currentEfficiency: 1,
          averageEfficiency: 1,
          operatingTime: 1,
          lastUpdate: 1,
          recordCount: 1,
          utilizationRate: {
            $multiply: [
              { $divide: ['$averageGeneration', '$capacity'] },
              100
            ]
          }
        }
      },
      { $sort: { totalGeneration: -1 } }
    ]);

    res.status(200).json({
      success: true,
      period,
      data: meterData
    });
  } catch (error) {
    console.error('Error fetching generation meters:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching generation meters data'
    });
  }
};

// @desc    Detect peak generation periods
// @route   GET /api/renewable/peak-detection
// @access  Private
const getPeakGeneration = async (req, res) => {
  try {
    const userId = req.user._id;
    const { sourceId, days = 30 } = req.query;

    const query = { user: userId };
    if (sourceId) query.source = new mongoose.Types.ObjectId(sourceId);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    query.recordDate = { $gte: startDate };

    // Analyze peak generation by hour of day
    const peakByHour = await RenewableEnergyRecord.aggregate([
      { $match: query },
      {
        $project: {
          hour: { $hour: '$recordDate' },
          energyGenerated: 1,
          peakPower: 1,
          weatherCondition: 1,
          efficiency: 1,
          source: 1
        }
      },
      {
        $group: {
          _id: '$hour',
          avgGeneration: { $avg: '$energyGenerated' },
          maxGeneration: { $max: '$energyGenerated' },
          avgPeakPower: { $avg: '$peakPower' },
          avgEfficiency: { $avg: '$efficiency' },
          recordCount: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Analyze peak by weather condition
    const peakByWeather = await RenewableEnergyRecord.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$weatherCondition',
          avgGeneration: { $avg: '$energyGenerated' },
          maxGeneration: { $max: '$energyGenerated' },
          avgEfficiency: { $avg: '$efficiency' },
          recordCount: { $sum: 1 }
        }
      },
      { $sort: { avgGeneration: -1 } }
    ]);

    // Find top peak generation records
    const topPeakRecords = await RenewableEnergyRecord.find(query)
      .populate('source', 'sourceName sourceType')
      .sort('-energyGenerated')
      .limit(10)
      .select('recordDate energyGenerated peakPower efficiency weatherCondition temperature source');

    // Calculate overall peak statistics
    const peakStats = await RenewableEnergyRecord.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          overallPeak: { $max: '$energyGenerated' },
          avgPeak: { $avg: '$peakPower' },
          peakEfficiency: { $max: '$efficiency' },
          totalRecords: { $sum: 1 }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        peakByHour,
        peakByWeather,
        topPeakRecords,
        statistics: peakStats[0] || {}
      }
    });
  } catch (error) {
    console.error('Error detecting peak generation:', error);
    res.status(500).json({
      success: false,
      message: 'Error analyzing peak generation'
    });
  }
};

// @desc    Check production thresholds and get alerts
// @route   GET /api/renewable/alerts
// @access  Private
const getProductionAlerts = async (req, res) => {
  try {
    const userId = req.user._id;
    const { thresholdPercentage = 50 } = req.query;

    // Get all active sources with their expected production
    const sources = await RenewableSource.find({ 
      user: userId, 
      status: 'Active' 
    });

    const alerts = [];
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    for (const source of sources) {
      // Get recent records for this source
      const recentRecords = await RenewableEnergyRecord.find({
        user: userId,
        source: source._id,
        recordDate: { $gte: last24Hours }
      });

      if (recentRecords.length === 0) {
        alerts.push({
          sourceId: source._id,
          sourceName: source.sourceName,
          sourceType: source.sourceType,
          alertType: 'no_data',
          severity: 'warning',
          message: 'No production data in last 24 hours',
          timestamp: now
        });
        continue;
      }

      const totalGeneration = recentRecords.reduce((sum, r) => sum + r.energyGenerated, 0);
      const avgGeneration = totalGeneration / recentRecords.length;
      const expectedDaily = source.capacity; // Simplified, could be more complex
      const threshold = (expectedDaily * thresholdPercentage) / 100;

      if (avgGeneration < threshold) {
        alerts.push({
          sourceId: source._id,
          sourceName: source.sourceName,
          sourceType: source.sourceType,
          alertType: 'low_production',
          severity: avgGeneration < threshold * 0.5 ? 'critical' : 'warning',
          message: `Production ${((avgGeneration / expectedDaily) * 100).toFixed(1)}% of capacity`,
          currentProduction: avgGeneration.toFixed(2),
          expectedProduction: expectedDaily,
          threshold: threshold.toFixed(2),
          timestamp: now
        });
      }

      // Check for efficiency drops
      const avgEfficiency = recentRecords.reduce((sum, r) => sum + (r.efficiency || 0), 0) / recentRecords.length;
      if (avgEfficiency < 70) {
        alerts.push({
          sourceId: source._id,
          sourceName: source.sourceName,
          sourceType: source.sourceType,
          alertType: 'low_efficiency',
          severity: avgEfficiency < 50 ? 'critical' : 'warning',
          message: `Low efficiency detected: ${avgEfficiency.toFixed(1)}%`,
          currentEfficiency: avgEfficiency.toFixed(1),
          timestamp: now
        });
      }
    }

    res.status(200).json({
      success: true,
      alertCount: alerts.length,
      data: alerts
    });
  } catch (error) {
    console.error('Error checking production alerts:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking production alerts'
    });
  }
};

// @desc    Get energy independence analytics
// @route   GET /api/renewable/independence
// @access  Private
const getEnergyIndependence = async (req, res) => {
  try {
    const userId = req.user._id;
    const { period = '30d' } = req.query;

    const now = new Date();
    let startDate = new Date();
    
    switch (period) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setDate(now.getDate() - 30);
    }

    // Get renewable energy generated
    const renewableProduction = await RenewableEnergyRecord.aggregate([
      {
        $match: {
          user: userId,
          recordDate: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: null,
          totalGenerated: { $sum: '$energyGenerated' },
          totalCostSavings: { $sum: '$costSavings' },
          totalCarbonOffset: { $sum: '$carbonOffset' },
          avgEfficiency: { $avg: '$efficiency' }
        }
      }
    ]);

    // Get energy consumption data (if available)
    const EnergyConsumption = mongoose.model('EnergyConsumption');
    const energyConsumption = await EnergyConsumption.aggregate([
      {
        $match: {
          user: userId,
          consumptionDate: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: null,
          totalConsumed: { $sum: '$consumption' }
        }
      }
    ]);

    const totalGenerated = renewableProduction[0]?.totalGenerated || 0;
    const totalConsumed = energyConsumption[0]?.totalConsumed || 0;
    
    // Calculate independence metrics
    const selfSufficiencyRatio = totalConsumed > 0 
      ? (totalGenerated / totalConsumed) * 100 
      : 0;
    
    const gridDependency = 100 - Math.min(selfSufficiencyRatio, 100);
    
    const excessEnergy = Math.max(0, totalGenerated - totalConsumed);
    const energyDeficit = Math.max(0, totalConsumed - totalGenerated);

    // Daily breakdown
    const dailyAnalysis = await RenewableEnergyRecord.aggregate([
      {
        $match: {
          user: userId,
          recordDate: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$recordDate' } },
          generated: { $sum: '$energyGenerated' }
        }
      },
      { $sort: { _id: 1 } },
      { $limit: 90 }
    ]);

    res.status(200).json({
      success: true,
      period,
      data: {
        totalGenerated: parseFloat(totalGenerated.toFixed(2)),
        totalConsumed: parseFloat(totalConsumed.toFixed(2)),
        selfSufficiencyRatio: parseFloat(selfSufficiencyRatio.toFixed(2)),
        gridDependency: parseFloat(gridDependency.toFixed(2)),
        excessEnergy: parseFloat(excessEnergy.toFixed(2)),
        energyDeficit: parseFloat(energyDeficit.toFixed(2)),
        costSavings: renewableProduction[0]?.totalCostSavings || 0,
        carbonOffset: renewableProduction[0]?.totalCarbonOffset || 0,
        averageEfficiency: renewableProduction[0]?.avgEfficiency || 0,
        dailyAnalysis,
        independenceLevel: selfSufficiencyRatio >= 100 ? 'fully_independent' :
                          selfSufficiencyRatio >= 75 ? 'highly_independent' :
                          selfSufficiencyRatio >= 50 ? 'moderately_independent' :
                          selfSufficiencyRatio >= 25 ? 'partially_independent' : 'grid_dependent'
      }
    });
  } catch (error) {
    console.error('Error calculating energy independence:', error);
    res.status(500).json({
      success: false,
      message: 'Error calculating energy independence'
    });
  }
};

// @desc    Get smart optimization recommendations
// @route   GET /api/renewable/recommendations
// @access  Private
const getOptimizationRecommendations = async (req, res) => {
  try {
    const userId = req.user._id;
    const recommendations = [];

    // Get all sources and their recent performance
    const sources = await RenewableSource.find({ user: userId });
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    for (const source of sources) {
      const records = await RenewableEnergyRecord.find({
        user: userId,
        source: source._id,
        recordDate: { $gte: thirtyDaysAgo }
      });

      if (records.length === 0) continue;

      const avgEfficiency = records.reduce((sum, r) => sum + (r.efficiency || 0), 0) / records.length;
      const totalGeneration = records.reduce((sum, r) => sum + r.energyGenerated, 0);
      const avgGeneration = totalGeneration / records.length;

      // Recommendation 1: Low Efficiency
      if (avgEfficiency < 75) {
        recommendations.push({
          sourceId: source._id,
          sourceName: source.sourceName,
          sourceType: source.sourceType,
          category: 'efficiency',
          priority: avgEfficiency < 50 ? 'high' : 'medium',
          title: 'Improve System Efficiency',
          description: `Current efficiency is ${avgEfficiency.toFixed(1)}%. Consider maintenance or system optimization.`,
          suggestions: [
            'Schedule professional maintenance',
            'Clean panels/turbines',
            'Check for shading or obstructions',
            'Verify inverter performance'
          ],
          potentialImprovement: `Up to ${(20 - (100 - avgEfficiency)).toFixed(0)}% efficiency gain`,
          estimatedImpact: 'high'
        });
      }

      // Recommendation 2: Underutilization
      const utilizationRate = (avgGeneration / source.capacity) * 100;
      if (utilizationRate < 50) {
        recommendations.push({
          sourceId: source._id,
          sourceName: source.sourceName,
          sourceType: source.sourceType,
          category: 'utilization',
          priority: 'medium',
          title: 'Increase System Utilization',
          description: `System is operating at ${utilizationRate.toFixed(1)}% of capacity.`,
          suggestions: source.sourceType === 'Solar' ? [
            'Optimize panel angle for seasonal changes',
            'Remove shading obstacles',
            'Consider adding more panels',
            'Check for panel degradation'
          ] : [
            'Review operational schedule',
            'Check for mechanical issues',
            'Optimize based on weather patterns'
          ],
          potentialImprovement: `${(100 - utilizationRate).toFixed(0)}% capacity available`,
          estimatedImpact: 'medium'
        });
      }

      // Recommendation 3: Weather-based optimization
      const weatherPerformance = {};
      records.forEach(r => {
        if (!weatherPerformance[r.weatherCondition]) {
          weatherPerformance[r.weatherCondition] = { total: 0, count: 0 };
        }
        weatherPerformance[r.weatherCondition].total += r.energyGenerated;
        weatherPerformance[r.weatherCondition].count += 1;
      });

      const bestWeather = Object.entries(weatherPerformance)
        .map(([weather, data]) => ({ weather, avg: data.total / data.count }))
        .sort((a, b) => b.avg - a.avg)[0];

      if (bestWeather && source.sourceType === 'Solar') {
        recommendations.push({
          sourceId: source._id,
          sourceName: source.sourceName,
          sourceType: source.sourceType,
          category: 'optimization',
          priority: 'low',
          title: 'Weather-Based Optimization',
          description: `Best performance during ${bestWeather.weather} conditions.`,
          suggestions: [
            'Monitor weather forecasts for peak production days',
            'Schedule high-energy tasks during optimal conditions',
            'Consider battery storage for peak production periods'
          ],
          potentialImprovement: 'Optimize energy usage timing',
          estimatedImpact: 'medium'
        });
      }

      // Recommendation 4: Maintenance Check
      const daysSinceInstall = Math.floor(
        (Date.now() - source.installationDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      const maintenanceRecords = records.filter(r => r.maintenancePerformed);
      const daysSinceLastMaintenance = maintenanceRecords.length > 0
        ? Math.floor((Date.now() - maintenanceRecords[0].recordDate.getTime()) / (1000 * 60 * 60 * 24))
        : daysSinceInstall;

      if (daysSinceLastMaintenance > 180) {
        recommendations.push({
          sourceId: source._id,
          sourceName: source.sourceName,
          sourceType: source.sourceType,
          category: 'maintenance',
          priority: daysSinceLastMaintenance > 365 ? 'high' : 'medium',
          title: 'Schedule Maintenance',
          description: `Last maintenance was ${daysSinceLastMaintenance} days ago.`,
          suggestions: [
            'Schedule professional inspection',
            'Check all electrical connections',
            'Clean and inspect components',
            'Update firmware/software if applicable'
          ],
          potentialImprovement: 'Prevent performance degradation',
          estimatedImpact: 'high'
        });
      }
    }

    // General recommendations
    const totalSources = sources.length;
    if (totalSources === 1) {
      recommendations.push({
        category: 'expansion',
        priority: 'low',
        title: 'Diversify Energy Sources',
        description: 'Consider adding different types of renewable sources for better reliability.',
        suggestions: [
          'Add complementary renewable sources (e.g., wind + solar)',
          'Increase energy independence',
          'Reduce weather-dependent variability'
        ],
        potentialImprovement: 'Increased energy security',
        estimatedImpact: 'medium'
      });
    }

    // Sort by priority
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    recommendations.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);

    res.status(200).json({
      success: true,
      count: recommendations.length,
      data: recommendations
    });
  } catch (error) {
    console.error('Error generating recommendations:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating optimization recommendations'
    });
  }
};

// @desc    Get renewable generation forecast
// @route   GET /api/renewable/forecast
// @access  Private
const getGenerationForecast = async (req, res) => {
  try {
    const userId = req.user._id;
    const { sourceId, period = '7d' } = req.query;
    const horizonDays = getForecastHorizonDays(period);

    const query = { user: userId };
    if (sourceId && mongoose.Types.ObjectId.isValid(sourceId)) {
      query.source = new mongoose.Types.ObjectId(sourceId);
    }

    const historyLookbackDays = Math.max(90, horizonDays * 6);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - historyLookbackDays);
    query.recordDate = { $gte: startDate };

    const dailySeries = await RenewableEnergyRecord.aggregate([
      { $match: query },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$recordDate' } },
          actualGeneration: { $sum: '$energyGenerated' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    if (dailySeries.length < 7) {
      return res.status(200).json({
        success: true,
        data: {
          sourceId: sourceId || null,
          period,
          model: 'moving_average_v1',
          confidence: 0,
          historyPoints: dailySeries.length,
          forecast: [],
          baseline: {
            avgLast30Days: 0,
            trend: 'flat'
          },
          message: 'Insufficient historical data. Add at least 7 days of records for forecasting.'
        }
      });
    }

    const values = dailySeries.map((entry) => entry.actualGeneration);
    const windowSize = Math.min(7, values.length);
    const movingAverageSeries = calculateMovingAverageSeries(values, windowSize);
    const recentValues = values.slice(-30);
    const recentAvg = recentValues.reduce((sum, value) => sum + value, 0) / recentValues.length;
    const slopeWindowValues = values.slice(-Math.min(30, values.length));
    const slope = calculateLinearTrendSlope(slopeWindowValues);
    const volatility = calculateStandardDeviation(slopeWindowValues);

    const trendLabel = slope > 0.2 ? 'up' : slope < -0.2 ? 'down' : 'flat';
    const confidenceBase = Math.min(1, values.length / 45);
    const volatilityPenalty = Math.min(0.45, volatility / (recentAvg || 1));
    const confidence = Math.max(0.15, confidenceBase - volatilityPenalty);

    const lastDate = new Date(dailySeries[dailySeries.length - 1]._id);
    const lastMovingAverage = movingAverageSeries[movingAverageSeries.length - 1];
    const forecast = [];

    for (let day = 1; day <= horizonDays; day += 1) {
      const forecastDate = new Date(lastDate);
      forecastDate.setDate(forecastDate.getDate() + day);

      const predicted = Math.max(0, lastMovingAverage + slope * day);
      const margin = 1.28 * volatility;

      forecast.push({
        date: forecastDate.toISOString().split('T')[0],
        predictedGeneration: parseFloat(predicted.toFixed(2)),
        lowerBound: parseFloat(Math.max(0, predicted - margin).toFixed(2)),
        upperBound: parseFloat((predicted + margin).toFixed(2))
      });
    }

    res.status(200).json({
      success: true,
      data: {
        sourceId: sourceId || null,
        period,
        model: 'moving_average_v1',
        confidence: parseFloat(confidence.toFixed(2)),
        historyPoints: values.length,
        forecast,
        historical: dailySeries.map((entry, index) => ({
          date: entry._id,
          actualGeneration: parseFloat(entry.actualGeneration.toFixed(2)),
          smoothedGeneration: parseFloat(movingAverageSeries[index].toFixed(2))
        })),
        baseline: {
          avgLast30Days: parseFloat(recentAvg.toFixed(2)),
          trend: trendLabel
        }
      }
    });
  } catch (error) {
    console.error('Error generating renewable forecast:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating renewable forecast'
    });
  }
};

// @desc    Get forecast model accuracy metrics
// @route   GET /api/renewable/forecast/accuracy
// @access  Private
const getForecastAccuracy = async (req, res) => {
  try {
    const userId = req.user._id;
    const { sourceId, period = '30d' } = req.query;

    const validPeriods = {
      '30d': 30,
      '90d': 90
    };
    const lookbackDays = validPeriods[period] || 30;

    const query = { user: userId };
    if (sourceId && mongoose.Types.ObjectId.isValid(sourceId)) {
      query.source = new mongoose.Types.ObjectId(sourceId);
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - Math.max(lookbackDays + 30, 120));
    query.recordDate = { $gte: startDate };

    const dailySeries = await RenewableEnergyRecord.aggregate([
      { $match: query },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$recordDate' } },
          actualGeneration: { $sum: '$energyGenerated' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const values = dailySeries.map((entry) => entry.actualGeneration);
    if (values.length < 15) {
      return res.status(200).json({
        success: true,
        data: {
          mape: null,
          rmse: null,
          samples: 0,
          message: 'Insufficient historical data. Add at least 15 days of records to evaluate accuracy.'
        }
      });
    }

    const evaluationWindow = Math.min(lookbackDays, values.length - 7);
    const startIndex = values.length - evaluationWindow;
    const windowSize = 7;

    const errors = [];
    const squaredErrors = [];

    for (let index = startIndex; index < values.length; index += 1) {
      const trainStart = Math.max(0, index - windowSize);
      const trainSlice = values.slice(trainStart, index);
      if (trainSlice.length < 3) continue;

      const prediction = trainSlice.reduce((sum, value) => sum + value, 0) / trainSlice.length;
      const actual = values[index];
      const absError = Math.abs(actual - prediction);

      if (actual > 0) {
        errors.push((absError / actual) * 100);
      }
      squaredErrors.push(absError ** 2);
    }

    const sampleCount = Math.min(errors.length, squaredErrors.length);
    const mape = sampleCount
      ? errors.slice(0, sampleCount).reduce((sum, value) => sum + value, 0) / sampleCount
      : null;
    const rmse = sampleCount
      ? Math.sqrt(squaredErrors.slice(0, sampleCount).reduce((sum, value) => sum + value, 0) / sampleCount)
      : null;

    res.status(200).json({
      success: true,
      data: {
        mape: mape !== null ? parseFloat(mape.toFixed(2)) : null,
        rmse: rmse !== null ? parseFloat(rmse.toFixed(2)) : null,
        samples: sampleCount,
        model: 'moving_average_v1'
      }
    });
  } catch (error) {
    console.error('Error evaluating forecast accuracy:', error);
    res.status(500).json({
      success: false,
      message: 'Error evaluating forecast accuracy'
    });
  }
};

// ============ MAINTENANCE TASK CONTROLLERS ============

// @desc    Create a maintenance task
// @route   POST /api/renewable/maintenance
// @access  Private
const createMaintenanceTask = async (req, res) => {
  try {
    const {
      sourceId,
      scheduledDate,
      completedDate,
      status,
      taskType,
      technician,
      notes,
      cost,
      reminderSent
    } = req.body;

    const source = await RenewableSource.findOne({ _id: sourceId, user: req.user._id });
    if (!source) {
      return res.status(404).json({
        success: false,
        message: 'Renewable source not found or does not belong to you'
      });
    }

    const maintenanceTask = await RenewableMaintenanceTask.create({
      user: req.user._id,
      sourceId,
      scheduledDate,
      completedDate: completedDate || null,
      status,
      taskType,
      technician,
      notes,
      cost,
      reminderSent
    });

    await maintenanceTask.populate('sourceId', 'sourceName sourceType');

    res.status(201).json({
      success: true,
      message: 'Maintenance task created successfully',
      data: maintenanceTask
    });
  } catch (error) {
    console.error('Error creating maintenance task:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error creating maintenance task'
    });
  }
};

// @desc    Get maintenance tasks with filters
// @route   GET /api/renewable/maintenance
// @access  Private
const getMaintenanceTasks = async (req, res) => {
  try {
    await syncMaintenanceTaskStatuses();

    const { status, sourceId, from, to } = req.query;
    const query = { user: req.user._id };

    if (status) query.status = status;
    if (sourceId && mongoose.Types.ObjectId.isValid(sourceId)) {
      query.sourceId = new mongoose.Types.ObjectId(sourceId);
    }

    if (from || to) {
      query.scheduledDate = {};
      if (from && !Number.isNaN(Date.parse(from))) {
        query.scheduledDate.$gte = new Date(from);
      }
      if (to && !Number.isNaN(Date.parse(to))) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        query.scheduledDate.$lte = toDate;
      }
    }

    const tasks = await RenewableMaintenanceTask.find(query)
      .populate('sourceId', 'sourceName sourceType')
      .sort({ status: 1, scheduledDate: 1, createdAt: -1 });

    res.status(200).json({
      success: true,
      count: tasks.length,
      data: tasks
    });
  } catch (error) {
    console.error('Error fetching maintenance tasks:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching maintenance tasks'
    });
  }
};

// @desc    Update maintenance task
// @route   PUT /api/renewable/maintenance/:id
// @access  Private
const updateMaintenanceTask = async (req, res) => {
  try {
    if (req.body.sourceId) {
      const source = await RenewableSource.findOne({ _id: req.body.sourceId, user: req.user._id });
      if (!source) {
        return res.status(404).json({
          success: false,
          message: 'Renewable source not found or does not belong to you'
        });
      }
    }

    const task = await RenewableMaintenanceTask.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      { new: true, runValidators: true }
    ).populate('sourceId', 'sourceName sourceType');

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Maintenance task not found'
      });
    }

    await syncMaintenanceTaskStatuses();

    res.status(200).json({
      success: true,
      message: 'Maintenance task updated successfully',
      data: task
    });
  } catch (error) {
    console.error('Error updating maintenance task:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error updating maintenance task'
    });
  }
};

// @desc    Delete maintenance task
// @route   DELETE /api/renewable/maintenance/:id
// @access  Private
const deleteMaintenanceTask = async (req, res) => {
  try {
    const task = await RenewableMaintenanceTask.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Maintenance task not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Maintenance task deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting maintenance task:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting maintenance task'
    });
  }
};

// @desc    Get maintenance task summary
// @route   GET /api/renewable/maintenance/summary
// @access  Private
const getMaintenanceSummary = async (req, res) => {
  try {
    await syncMaintenanceTaskStatuses();

    const userId = req.user._id;
    const startOfToday = getStartOfToday();
    const endOfWeek = new Date(startOfToday);
    endOfWeek.setDate(endOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const monthStart = new Date(startOfToday.getFullYear(), startOfToday.getMonth(), 1);
    const monthEnd = new Date(startOfToday.getFullYear(), startOfToday.getMonth() + 1, 0, 23, 59, 59, 999);

    const [totalScheduled, overdue, dueThisWeek, completedThisMonth, nextTask] = await Promise.all([
      RenewableMaintenanceTask.countDocuments({ user: userId, status: 'scheduled' }),
      RenewableMaintenanceTask.countDocuments({ user: userId, status: 'overdue' }),
      RenewableMaintenanceTask.countDocuments({
        user: userId,
        status: { $in: ['scheduled', 'overdue'] },
        scheduledDate: { $gte: startOfToday, $lte: endOfWeek }
      }),
      RenewableMaintenanceTask.countDocuments({
        user: userId,
        status: 'completed',
        completedDate: { $gte: monthStart, $lte: monthEnd }
      }),
      RenewableMaintenanceTask.findOne({
        user: userId,
        status: { $in: ['scheduled', 'overdue'] },
        scheduledDate: { $gte: startOfToday }
      })
        .populate('sourceId', 'sourceName')
        .sort({ scheduledDate: 1 })
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalScheduled,
        overdue,
        dueThisWeek,
        completedThisMonth,
        nextTask: nextTask
          ? {
              sourceName: nextTask.sourceId?.sourceName || 'Unknown Source',
              scheduledDate: nextTask.scheduledDate,
              taskType: nextTask.taskType
            }
          : null
      }
    });
  } catch (error) {
    console.error('Error generating maintenance summary:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating maintenance summary'
    });
  }
};

// @desc    Get expected vs actual variance summary
// @route   GET /api/renewable/variance
// @access  Private
const getVarianceAnalytics = async (req, res) => {
  try {
    const userId = req.user._id;
    const { period = '30d', sourceId, underperformingThreshold = 15 } = req.query;
    const threshold = Number(underperformingThreshold) || 15;
    const periodDays = getVariancePeriodDays(period);

    const sourceQuery = { user: userId };
    if (sourceId) {
      if (!mongoose.Types.ObjectId.isValid(sourceId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid sourceId provided'
        });
      }
      sourceQuery._id = new mongoose.Types.ObjectId(sourceId);
    }

    const sources = await RenewableSource.find(sourceQuery).select('sourceName sourceType estimatedAnnualProduction');

    if (!sources.length) {
      return res.status(200).json({
        success: true,
        data: {
          period,
          threshold,
          formula: 'expectedEnergy = estimatedAnnualProduction * (periodDays / 365)',
          overall: {
            expectedEnergy: 0,
            actualEnergy: 0,
            variance: 0,
            variancePercent: 0
          },
          bySource: [],
          insights: ['No renewable sources found for the selected filters.']
        }
      });
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - periodDays);

    const sourceIds = sources.map((source) => source._id);

    const actualBySource = await RenewableEnergyRecord.aggregate([
      {
        $match: {
          user: userId,
          source: { $in: sourceIds },
          recordDate: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$source',
          actualEnergy: { $sum: '$energyGenerated' }
        }
      }
    ]);

    const actualMap = new Map(actualBySource.map((entry) => [String(entry._id), entry.actualEnergy]));

    const bySource = sources.map((source) => {
      const expectedEnergy = ((source.estimatedAnnualProduction || 0) * periodDays) / 365;
      const actualEnergy = actualMap.get(String(source._id)) || 0;
      const variance = actualEnergy - expectedEnergy;
      const variancePercent = expectedEnergy > 0 ? (variance / expectedEnergy) * 100 : 0;

      let status = 'on_target';
      if (variancePercent < -threshold) status = 'underperforming';
      if (variancePercent > threshold) status = 'overperforming';

      return {
        sourceId: source._id,
        sourceName: source.sourceName,
        sourceType: source.sourceType,
        expectedEnergy: parseFloat(expectedEnergy.toFixed(2)),
        actualEnergy: parseFloat(actualEnergy.toFixed(2)),
        variance: parseFloat(variance.toFixed(2)),
        variancePercent: parseFloat(variancePercent.toFixed(2)),
        status
      };
    });

    const overallExpected = bySource.reduce((sum, item) => sum + item.expectedEnergy, 0);
    const overallActual = bySource.reduce((sum, item) => sum + item.actualEnergy, 0);
    const overallVariance = overallActual - overallExpected;
    const overallVariancePercent = overallExpected > 0 ? (overallVariance / overallExpected) * 100 : 0;

    const underperformingCount = bySource.filter((item) => item.variancePercent < -threshold).length;
    const overperformingSources = bySource
      .filter((item) => item.variancePercent > 0)
      .sort((a, b) => b.variancePercent - a.variancePercent);

    const insights = [];
    insights.push(`${underperformingCount} sources are underperforming by more than ${threshold}%`);

    if (overperformingSources.length > 0) {
      const top = overperformingSources[0];
      insights.push(`${top.sourceType} source exceeded expected output by ${top.variancePercent.toFixed(1)}%`);
    } else {
      insights.push('No sources exceeded expected output in the selected period.');
    }

    res.status(200).json({
      success: true,
      data: {
        period,
        threshold,
        formula: 'expectedEnergy = estimatedAnnualProduction * (periodDays / 365)',
        overall: {
          expectedEnergy: parseFloat(overallExpected.toFixed(2)),
          actualEnergy: parseFloat(overallActual.toFixed(2)),
          variance: parseFloat(overallVariance.toFixed(2)),
          variancePercent: parseFloat(overallVariancePercent.toFixed(2))
        },
        bySource,
        insights
      }
    });
  } catch (error) {
    console.error('Error calculating variance analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Error calculating variance analytics'
    });
  }
};

// @desc    Get monthly variance trend
// @route   GET /api/renewable/variance/trend
// @access  Private
const getVarianceTrend = async (req, res) => {
  try {
    const userId = req.user._id;
    const { sourceId, months = 12, underperformingThreshold = 15 } = req.query;
    const monthCount = Math.max(1, Math.min(36, Number(months) || 12));
    const threshold = Number(underperformingThreshold) || 15;

    const sourceQuery = { user: userId };
    if (sourceId) {
      if (!mongoose.Types.ObjectId.isValid(sourceId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid sourceId provided'
        });
      }
      sourceQuery._id = new mongoose.Types.ObjectId(sourceId);
    }

    const sources = await RenewableSource.find(sourceQuery).select('estimatedAnnualProduction');
    const sourceIds = sources.map((source) => source._id);

    if (!sources.length) {
      return res.status(200).json({
        success: true,
        data: {
          months: monthCount,
          threshold,
          trend: []
        }
      });
    }

    const startDate = new Date();
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);
    startDate.setMonth(startDate.getMonth() - (monthCount - 1));

    const monthlyActual = await RenewableEnergyRecord.aggregate([
      {
        $match: {
          user: userId,
          source: { $in: sourceIds },
          recordDate: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$recordDate' },
            month: { $month: '$recordDate' }
          },
          actualEnergy: { $sum: '$energyGenerated' }
        }
      }
    ]);

    const actualMap = new Map(
      monthlyActual.map((entry) => {
        const key = `${entry._id.year}-${String(entry._id.month).padStart(2, '0')}`;
        return [key, entry.actualEnergy];
      })
    );

    const totalAnnualEstimate = sources.reduce((sum, source) => sum + (source.estimatedAnnualProduction || 0), 0);
    const expectedPerMonth = totalAnnualEstimate / 12;

    const trend = [];
    for (let index = 0; index < monthCount; index += 1) {
      const cursor = new Date(startDate);
      cursor.setMonth(startDate.getMonth() + index);
      const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`;

      const actualEnergy = actualMap.get(key) || 0;
      const variance = actualEnergy - expectedPerMonth;
      const variancePercent = expectedPerMonth > 0 ? (variance / expectedPerMonth) * 100 : 0;

      trend.push({
        month: key,
        expectedEnergy: parseFloat(expectedPerMonth.toFixed(2)),
        actualEnergy: parseFloat(actualEnergy.toFixed(2)),
        variance: parseFloat(variance.toFixed(2)),
        variancePercent: parseFloat(variancePercent.toFixed(2)),
        status: variancePercent < -threshold ? 'underperforming' : variancePercent > threshold ? 'overperforming' : 'on_target'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        months: monthCount,
        threshold,
        trend
      }
    });
  } catch (error) {
    console.error('Error calculating variance trend:', error);
    res.status(500).json({
      success: false,
      message: 'Error calculating variance trend'
    });
  }
};

// @desc    Get weather-driven renewable production insights (third-party API)
// @route   GET /api/renewable/weather-insights
// @access  Private
const getWeatherInsights = async (req, res) => {
  try {
    const { sourceId, location, latitude, longitude } = req.query;

    let locationLabel = location;
    let lat = latitude ? Number(latitude) : null;
    let lon = longitude ? Number(longitude) : null;

    if (sourceId && mongoose.Types.ObjectId.isValid(sourceId)) {
      const source = await RenewableSource.findOne({
        _id: sourceId,
        user: req.user._id
      }).select('sourceName location');

      if (!source) {
        return res.status(404).json({
          success: false,
          message: 'Renewable source not found'
        });
      }

      locationLabel = locationLabel || source.location || source.sourceName;
    }

    if ((!lat || !lon) && locationLabel) {
      const geoResponse = await axios.get('https://geocoding-api.open-meteo.com/v1/search', {
        params: {
          name: locationLabel,
          count: 1
        },
        timeout: 10000
      });

      const geoResult = geoResponse.data?.results?.[0];
      if (!geoResult) {
        return res.status(404).json({
          success: false,
          message: 'Unable to geocode the provided location'
        });
      }

      lat = geoResult.latitude;
      lon = geoResult.longitude;
      locationLabel = `${geoResult.name}${geoResult.country ? `, ${geoResult.country}` : ''}`;
    }

    if (!lat || !lon) {
      return res.status(400).json({
        success: false,
        message: 'Provide sourceId, location, or both latitude and longitude'
      });
    }

    const weatherResponse = await axios.get('https://api.open-meteo.com/v1/forecast', {
      params: {
        latitude: lat,
        longitude: lon,
        daily: 'temperature_2m_max,temperature_2m_min,sunshine_duration,weathercode',
        timezone: 'auto',
        forecast_days: 5
      },
      timeout: 10000
    });

    const daily = weatherResponse.data?.daily;
    if (!daily?.time?.length) {
      return res.status(502).json({
        success: false,
        message: 'Weather provider returned incomplete forecast data'
      });
    }

    const forecast = daily.time.map((date, index) => {
      const sunshineHours = (daily.sunshine_duration?.[index] || 0) / 3600;
      const weatherCode = daily.weathercode?.[index];
      const productionLevel = sunshineHours >= 8 ? 'high' : sunshineHours >= 5 ? 'moderate' : 'low';

      return {
        date,
        weather: mapWeatherCodeToLabel(weatherCode),
        minTemp: daily.temperature_2m_min?.[index],
        maxTemp: daily.temperature_2m_max?.[index],
        sunshineHours: Number(sunshineHours.toFixed(2)),
        projectedProductionLevel: productionLevel
      };
    });

    res.status(200).json({
      success: true,
      data: {
        provider: 'open-meteo',
        location: locationLabel || `${lat},${lon}`,
        coordinates: { latitude: lat, longitude: lon },
        forecast
      }
    });
  } catch (error) {
    console.error('Error fetching weather insights:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error fetching weather insights'
    });
  }
};

// @desc    Admin-only renewable overview across users
// @route   GET /api/renewable/admin/overview
// @access  Private/Admin
const getAdminRenewableOverview = async (req, res) => {
  try {
    const [sourceCount, recordCount, maintenanceCount] = await Promise.all([
      RenewableSource.countDocuments(),
      RenewableEnergyRecord.countDocuments(),
      RenewableMaintenanceTask.countDocuments()
    ]);

    const totalEnergy = await RenewableEnergyRecord.aggregate([
      {
        $group: {
          _id: null,
          totalEnergyGenerated: { $sum: '$energyGenerated' }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalSources: sourceCount,
        totalRecords: recordCount,
        totalMaintenanceTasks: maintenanceCount,
        totalEnergyGenerated: totalEnergy[0]?.totalEnergyGenerated || 0
      }
    });
  } catch (error) {
    console.error('Error fetching admin renewable overview:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching admin renewable overview'
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
  getDashboardSummary,

  // Advanced analytics controllers
  getGenerationMeters,
  getPeakGeneration,
  getProductionAlerts,
  getEnergyIndependence,
  getOptimizationRecommendations,
  getGenerationForecast,
  getForecastAccuracy,
  getWeatherInsights,
  getAdminRenewableOverview,

  // Maintenance controllers
  createMaintenanceTask,
  getMaintenanceTasks,
  updateMaintenanceTask,
  deleteMaintenanceTask,
  getMaintenanceSummary,

  // Variance analytics controllers
  getVarianceAnalytics,
  getVarianceTrend,

  // Expose pure helpers for unit testing
  __testables: {
    getForecastHorizonDays,
    calculateMovingAverageSeries,
    calculateLinearTrendSlope,
    calculateStandardDeviation,
    getVariancePeriodDays,
    mapWeatherCodeToLabel
  }
};
