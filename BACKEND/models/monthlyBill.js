const mongoose = require('mongoose');

const monthlyBillSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },
  billNumber: {
    type: String,
    required: [true, 'Bill Number is required'],
    trim: true,
    uppercase: true
  },
  billIssueDate: {
    type: Date,
    required: [true, 'Bill Issue Date is required']
  },
  totalKWh: {
    type: Number,
    required: [true, 'Total kWh is required'],
    min: [0, 'Total kWh cannot be negative']
  },
  totalPayment: {
    type: Number,
    required: [true, 'Total Payment is required'],
    min: [0, 'Total Payment cannot be negative']
  },
  totalPaid: {
    type: Number,
    required: [true, 'Total Paid is required'],
    min: [0, 'Total Paid cannot be negative'],
    default: 0
  },
  balance: {
    type: Number,
    default: function() {
      return this.totalPayment - this.totalPaid;
    }
  },
  isPaid: {
    type: Boolean,
    default: function() {
      return this.totalPaid >= this.totalPayment;
    }
  },
  billPhoto: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Calculate balance before saving
monthlyBillSchema.pre('save', function(next) {
  this.balance = this.totalPayment - this.totalPaid;
  this.isPaid = this.totalPaid >= this.totalPayment;
  next();
});

// Index for faster queries
monthlyBillSchema.index({ user: 1, billNumber: 1 }, { unique: true });
monthlyBillSchema.index({ user: 1, billIssueDate: -1 });

module.exports = mongoose.model('MonthlyBill', monthlyBillSchema);
