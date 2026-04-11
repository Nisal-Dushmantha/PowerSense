const RenewableMaintenanceTask = require('../models/RenewableMaintenanceTask');

const getStartOfToday = () => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
};

const syncMaintenanceTaskStatuses = async () => {
  const startOfToday = getStartOfToday();

  await RenewableMaintenanceTask.updateMany(
    {
      completedDate: { $ne: null },
      status: { $ne: 'completed' }
    },
    {
      $set: { status: 'completed' }
    }
  );

  await RenewableMaintenanceTask.updateMany(
    {
      completedDate: null,
      scheduledDate: { $lt: startOfToday },
      status: { $ne: 'overdue' }
    },
    {
      $set: { status: 'overdue' }
    }
  );

  await RenewableMaintenanceTask.updateMany(
    {
      completedDate: null,
      scheduledDate: { $gte: startOfToday },
      status: 'overdue'
    },
    {
      $set: { status: 'scheduled' }
    }
  );
};

const startMaintenanceStatusScheduler = () => {
  // Run immediately at startup.
  syncMaintenanceTaskStatuses().catch((error) => {
    console.error('Maintenance scheduler initial sync failed:', error.message);
  });

  // Then run once a day.
  setInterval(() => {
    syncMaintenanceTaskStatuses().catch((error) => {
      console.error('Maintenance scheduler periodic sync failed:', error.message);
    });
  }, 24 * 60 * 60 * 1000);
};

module.exports = {
  syncMaintenanceTaskStatuses,
  startMaintenanceStatusScheduler
};
