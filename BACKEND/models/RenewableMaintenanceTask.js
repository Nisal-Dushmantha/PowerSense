const mongoose = require('mongoose');

const renewableMaintenanceTaskSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },
  sourceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RenewableSource',
    required: [true, 'Renewable source is required']
  },
  scheduledDate: {
    type: Date,
    required: [true, 'Scheduled date is required']
  },
  completedDate: {
    type: Date,
    default: null
  },
  status: {
    type: String,
    enum: ['scheduled', 'completed', 'overdue'],
    default: 'scheduled'
  },
  taskType: {
    type: String,
    required: [true, 'Task type is required'],
    trim: true,
    maxlength: [120, 'Task type cannot exceed 120 characters']
  },
  technician: {
    type: String,
    trim: true,
    maxlength: [120, 'Technician name cannot exceed 120 characters']
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  cost: {
    type: Number,
    min: [0, 'Maintenance cost cannot be negative'],
    default: 0
  },
  reminderSent: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

const getStartOfToday = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

renewableMaintenanceTaskSchema.pre('save', function(next) {
  const startOfToday = getStartOfToday();

  if (this.completedDate) {
    this.status = 'completed';
    return next();
  }

  if (this.scheduledDate < startOfToday) {
    this.status = 'overdue';
  } else {
    this.status = 'scheduled';
  }

  next();
});

renewableMaintenanceTaskSchema.index({ user: 1, status: 1, scheduledDate: 1 });
renewableMaintenanceTaskSchema.index({ user: 1, sourceId: 1, scheduledDate: 1 });

module.exports = mongoose.model('RenewableMaintenanceTask', renewableMaintenanceTaskSchema);
