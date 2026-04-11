const User = require('../models/User');
const Device = require('../models/devices');
const EnergyConsumption = require('../models/energyConsumption');
const MonthlyBill = require('../models/monthlyBill');
const RenewableSource = require('../models/RenewableSource');
const RenewableEnergyRecord = require('../models/RenewableEnergyRecord');
const AdminAuditLog = require('../models/AdminAuditLog');

const writeAuditLog = async ({ adminUser, targetUser, action, previousValue, newValue, metadata = {} }) => {
  await AdminAuditLog.create({
    adminUser,
    targetUser,
    action,
    previousValue: String(previousValue),
    newValue: String(newValue),
    metadata
  });
};

const getAdminSummary = async (req, res) => {
  try {
    const [
      totalUsers,
      activeUsers,
      adminUsers,
      totalDevices,
      totalReadings,
      totalBills,
      totalSources,
      totalRenewableRecords
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
      User.countDocuments({ role: 'admin' }),
      Device.countDocuments(),
      EnergyConsumption.countDocuments(),
      MonthlyBill.countDocuments(),
      RenewableSource.countDocuments(),
      RenewableEnergyRecord.countDocuments()
    ]);

    res.json({
      success: true,
      message: 'Admin summary fetched successfully',
      data: {
        users: {
          total: totalUsers,
          active: activeUsers,
          admins: adminUsers
        },
        modules: {
          devices: totalDevices,
          consumptionReadings: totalReadings,
          bills: totalBills,
          renewableSources: totalSources,
          renewableRecords: totalRenewableRecords
        }
      }
    });
  } catch (error) {
    console.error('Admin summary error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', role = '', status = '' } = req.query;

    const safePage = Math.max(parseInt(page, 10) || 1, 1);
    const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
    const skip = (safePage - 1) * safeLimit;

    const query = {};
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    if (role) query.role = role;
    if (status === 'active') query.isActive = true;
    if (status === 'inactive') query.isActive = false;

    const [users, total] = await Promise.all([
      User.find(query)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(safeLimit),
      User.countDocuments(query)
    ]);

    res.json({
      success: true,
      message: 'Users fetched successfully',
      data: users,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages: Math.ceil(total / safeLimit)
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Role must be user or admin' });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const previousRole = user.role;

    user.role = role;
    await user.save();

    if (previousRole !== role) {
      await writeAuditLog({
        adminUser: req.user.id,
        targetUser: user._id,
        action: 'role-change',
        previousValue: previousRole,
        newValue: role,
        metadata: {
          targetEmail: user.email
        }
      });
    }

    res.json({
      success: true,
      message: 'User role updated successfully',
      data: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        isActive: user.isActive
      }
    });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ success: false, message: 'isActive must be boolean' });
    }

    if (req.user.id === id && isActive === false) {
      return res.status(400).json({ success: false, message: 'You cannot deactivate your own account' });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const previousStatus = user.isActive;

    user.isActive = isActive;
    await user.save();

    if (previousStatus !== isActive) {
      await writeAuditLog({
        adminUser: req.user.id,
        targetUser: user._id,
        action: 'status-change',
        previousValue: previousStatus,
        newValue: isActive,
        metadata: {
          targetEmail: user.email
        }
      });
    }

    res.json({
      success: true,
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        isActive: user.isActive
      }
    });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

const getAuditLogs = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const safePage = Math.max(parseInt(page, 10) || 1, 1);
    const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
    const skip = (safePage - 1) * safeLimit;

    const [logs, total] = await Promise.all([
      AdminAuditLog.find()
        .populate('adminUser', 'firstName lastName email')
        .populate('targetUser', 'firstName lastName email role isActive')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(safeLimit),
      AdminAuditLog.countDocuments()
    ]);

    res.json({
      success: true,
      message: 'Audit logs fetched successfully',
      data: logs,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages: Math.ceil(total / safeLimit)
      }
    });
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

module.exports = {
  getAdminSummary,
  getAllUsers,
  getAuditLogs,
  updateUserRole,
  updateUserStatus
};
