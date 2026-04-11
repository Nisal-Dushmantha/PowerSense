const EnergyConsumption = require('../models/energyConsumption');

const buildQuery = (userId, query = {}) => {
  const filter = { user: userId };

  if (query.id) {
    filter._id = query.id;
  }

  if (query.period_type) {
    filter.period_type = query.period_type;
  }

  if (query.startDate || query.endDate) {
    filter.consumption_date = {};
    if (query.startDate) {
      filter.consumption_date.$gte = new Date(query.startDate);
    }
    if (query.endDate) {
      filter.consumption_date.$lte = new Date(query.endDate);
    }
  }

  if (query.search) {
    filter.meter_id = { $regex: query.search, $options: 'i' };
  }

  return filter;
};

exports.getEnergyRecords = async (req, res) => {
  try {
    const filter = buildQuery(req.user.id, req.query);
    const records = await EnergyConsumption.find(filter).sort({ consumption_date: -1, created_at: -1 });

    res.status(200).json({
      success: true,
      count: records.length,
      data: records
    });
  } catch (error) {
    console.error('getEnergyRecords error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch records' });
  }
};

exports.createEnergyRecord = async (req, res) => {
  try {
    const record = await EnergyConsumption.create({
      ...req.body,
      user: req.user.id
    });

    res.status(201).json({
      success: true,
      message: 'Energy record created successfully',
      data: record
    });
  } catch (error) {
    console.error('createEnergyRecord error:', error);
    res.status(400).json({ success: false, message: error.message || 'Failed to create record' });
  }
};

exports.updateEnergyRecord = async (req, res) => {
  try {
    const record = await EnergyConsumption.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!record) {
      return res.status(404).json({ success: false, message: 'Record not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Energy record updated successfully',
      data: record
    });
  } catch (error) {
    console.error('updateEnergyRecord error:', error);
    res.status(400).json({ success: false, message: error.message || 'Failed to update record' });
  }
};

exports.deleteEnergyRecord = async (req, res) => {
  try {
    const record = await EnergyConsumption.findOneAndDelete({ _id: req.params.id, user: req.user.id });

    if (!record) {
      return res.status(404).json({ success: false, message: 'Record not found' });
    }

    res.status(200).json({ success: true, message: 'Energy record deleted successfully' });
  } catch (error) {
    console.error('deleteEnergyRecord error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete record' });
  }
};

exports.getTotalConsumption = async (req, res) => {
  try {
    const { startDate, endDate, period = 'daily' } = req.query;
    const filter = buildQuery(req.user.id, { startDate, endDate });

    const records = await EnergyConsumption.find(filter).sort({ consumption_date: 1 });

    const total = records.reduce((sum, item) => sum + (item.energy_used_kwh || 0), 0);

    const grouped = new Map();
    records.forEach((item) => {
      const d = new Date(item.consumption_date);
      let key;

      if (period === 'monthly') {
        key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      } else if (period === 'weekly') {
        const weekStart = new Date(d);
        weekStart.setDate(d.getDate() - d.getDay());
        key = weekStart.toISOString().split('T')[0];
      } else if (period === 'hourly') {
        const datePart = d.toISOString().split('T')[0];
        const hour = item.consumption_time ? item.consumption_time.slice(0, 2) : '00';
        key = `${datePart} ${hour}:00`;
      } else {
        key = d.toISOString().split('T')[0];
      }

      grouped.set(key, (grouped.get(key) || 0) + (item.energy_used_kwh || 0));
    });

    const data = Array.from(grouped.entries()).map(([label, value]) => ({
      consumption_date: label,
      energy_used_kwh: Number(value.toFixed(2)),
      period_type: period
    }));

    const average = data.length ? total / data.length : 0;

    res.status(200).json({
      success: true,
      data: {
        total_consumption: Number(total.toFixed(2)),
        average_daily: Number(average.toFixed(2)),
        data
      }
    });
  } catch (error) {
    console.error('getTotalConsumption error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch total consumption' });
  }
};
