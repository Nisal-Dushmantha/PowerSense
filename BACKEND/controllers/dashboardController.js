const mongoose = require('mongoose');
const EnergyConsumption = require('../models/energyConsumption');
const Device = require('../models/devices');
const MonthlyBill = require('../models/monthlyBill');
const RenewableEnergyRecord = require('../models/RenewableEnergyRecord');

const getDashboardSummary = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const [
      devices,
      consumptionAggregate,
      monthlyConsumptionAggregate,
      billAggregate,
      renewableAggregate,
      lastReading
    ] = await Promise.all([
      Device.find({ user: userId }).select('dailyKwh monthlyKwh'),
      EnergyConsumption.aggregate([
        { $match: { user: userId } },
        {
          $group: {
            _id: null,
            totalRecords: { $sum: 1 },
            totalKwh: { $sum: '$energy_used_kwh' }
          }
        }
      ]),
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
            monthKwh: { $sum: '$energy_used_kwh' }
          }
        }
      ]),
      MonthlyBill.aggregate([
        { $match: { user: userId } },
        {
          $group: {
            _id: null,
            totalBills: { $sum: 1 },
            totalPayment: { $sum: '$totalPayment' },
            totalPaid: { $sum: '$totalPaid' },
            pendingCount: {
              $sum: {
                $cond: [{ $eq: ['$isPaid', false] }, 1, 0]
              }
            }
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
            monthRenewableKwh: {
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
      EnergyConsumption.findOne({ user: userId })
        .sort({ consumption_date: -1 })
        .select('consumption_date energy_used_kwh period_type meter_id')
    ]);

    const deviceStats = devices.reduce(
      (acc, device) => {
        acc.totalDailyKwh += Number(device.dailyKwh || 0);
        acc.totalMonthlyKwh += Number(device.monthlyKwh || 0);
        return acc;
      },
      { totalDailyKwh: 0, totalMonthlyKwh: 0 }
    );

    const consumptionStats = consumptionAggregate[0] || { totalRecords: 0, totalKwh: 0 };
    const monthlyConsumption = monthlyConsumptionAggregate[0]?.monthKwh || 0;
    const billStats = billAggregate[0] || {
      totalBills: 0,
      totalPayment: 0,
      totalPaid: 0,
      pendingCount: 0
    };
    const renewableMonthKwh = renewableAggregate[0]?.monthRenewableKwh || 0;

    res.json({
      success: true,
      message: 'Dashboard summary fetched successfully',
      data: {
        consumption: {
          totalRecords: consumptionStats.totalRecords,
          totalKwh: Number(consumptionStats.totalKwh.toFixed(2)),
          thisMonthKwh: Number(monthlyConsumption.toFixed(2)),
          lastReading: lastReading
            ? {
                date: lastReading.consumption_date,
                kwh: lastReading.energy_used_kwh,
                periodType: lastReading.period_type,
                meterId: lastReading.meter_id
              }
            : null
        },
        devices: {
          totalDevices: devices.length,
          estimatedDailyKwh: Number(deviceStats.totalDailyKwh.toFixed(2)),
          estimatedMonthlyKwh: Number(deviceStats.totalMonthlyKwh.toFixed(2))
        },
        bills: {
          totalBills: billStats.totalBills,
          totalPayment: Number(billStats.totalPayment.toFixed(2)),
          totalPaid: Number(billStats.totalPaid.toFixed(2)),
          pendingCount: billStats.pendingCount
        },
        renewable: {
          thisMonthKwh: Number(renewableMonthKwh.toFixed(2)),
          netGridKwh: Number(Math.max(0, monthlyConsumption - renewableMonthKwh).toFixed(2))
        }
      }
    });
  } catch (error) {
    console.error('Dashboard summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard summary',
      error: error.message
    });
  }
};

module.exports = {
  getDashboardSummary
};
