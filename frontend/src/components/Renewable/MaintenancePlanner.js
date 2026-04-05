import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Modal from '../common/Modal';
import { renewableService } from '../../services/api';

const statusColumns = [
  { key: 'scheduled', label: 'Scheduled', icon: '🗓️', color: 'border-blue-200 bg-blue-50' },
  { key: 'overdue', label: 'Overdue', icon: '🚨', color: 'border-red-200 bg-red-50' },
  { key: 'completed', label: 'Completed', icon: '✅', color: 'border-emerald-200 bg-emerald-50' }
];

const taskTypeOptions = [
  'Panel Cleaning',
  'Inverter Check',
  'Electrical Inspection',
  'Sensor Calibration',
  'Battery Check',
  'Mechanical Service',
  'General Maintenance'
];

const MaintenancePlanner = () => {
  const [tasks, setTasks] = useState([]);
  const [sources, setSources] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [statusFilter, setStatusFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');

  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const initialFormData = {
    sourceId: '',
    scheduledDate: '',
    completedDate: '',
    status: 'scheduled',
    taskType: 'General Maintenance',
    technician: '',
    notes: '',
    cost: 0,
    reminderSent: false
  };

  const [formData, setFormData] = useState(initialFormData);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const taskParams = {
        ...(statusFilter !== 'all' ? { status: statusFilter } : {}),
        ...(sourceFilter !== 'all' ? { sourceId: sourceFilter } : {})
      };

      const [taskResponse, sourceResponse, summaryResponse] = await Promise.all([
        renewableService.getMaintenanceTasks(taskParams),
        renewableService.getSources({ status: 'Active' }),
        renewableService.getMaintenanceSummary()
      ]);

      setTasks(taskResponse.data.data || []);
      setSources(sourceResponse.data.data || []);
      setSummary(summaryResponse.data.data || null);
    } catch (err) {
      console.error('Error loading maintenance planner data:', err);
      setError('Failed to load maintenance planner data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [sourceFilter, statusFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getStartOfToday = () => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  };

  const dueSoonCount = useMemo(() => {
    const today = getStartOfToday();
    const inTwoDays = new Date(today);
    inTwoDays.setDate(inTwoDays.getDate() + 2);

    return tasks.filter((task) => {
      if (task.status === 'completed') return false;
      const taskDate = new Date(task.scheduledDate);
      return taskDate >= today && taskDate <= inTwoDays;
    }).length;
  }, [tasks]);

  const calendarStrip = useMemo(() => {
    const today = getStartOfToday();

    return Array.from({ length: 14 }).map((_, index) => {
      const day = new Date(today);
      day.setDate(day.getDate() + index);

      const dayKey = day.toISOString().split('T')[0];
      const dayTasks = tasks.filter((task) => task.scheduledDate?.split('T')[0] === dayKey);

      return {
        day,
        dayKey,
        total: dayTasks.length,
        overdue: dayTasks.filter((task) => task.status === 'overdue').length,
        scheduled: dayTasks.filter((task) => task.status === 'scheduled').length,
        completed: dayTasks.filter((task) => task.status === 'completed').length
      };
    });
  }, [tasks]);

  const groupedTasks = useMemo(() => {
    return {
      scheduled: tasks.filter((task) => task.status === 'scheduled'),
      overdue: tasks.filter((task) => task.status === 'overdue'),
      completed: tasks.filter((task) => task.status === 'completed')
    };
  }, [tasks]);

  const openCreateModal = () => {
    setEditingTask(null);
    setFormData({
      ...initialFormData,
      sourceId: sources[0]?._id || '',
      scheduledDate: new Date().toISOString().split('T')[0]
    });
    setShowTaskModal(true);
  };

  const openEditModal = (task) => {
    setEditingTask(task);
    setFormData({
      sourceId: task.sourceId?._id || '',
      scheduledDate: task.scheduledDate ? task.scheduledDate.split('T')[0] : '',
      completedDate: task.completedDate ? task.completedDate.split('T')[0] : '',
      status: task.status,
      taskType: task.taskType || 'General Maintenance',
      technician: task.technician || '',
      notes: task.notes || '',
      cost: task.cost || 0,
      reminderSent: !!task.reminderSent
    });
    setShowTaskModal(true);
  };

  const handleFormChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSaveTask = async (event) => {
    event.preventDefault();

    if (!formData.sourceId || !formData.scheduledDate || !formData.taskType) {
      setError('Source, scheduled date, and task type are required.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const payload = {
        ...formData,
        cost: Number(formData.cost) || 0,
        completedDate: formData.completedDate || null
      };

      if (editingTask) {
        await renewableService.updateMaintenanceTask(editingTask._id, payload);
      } else {
        await renewableService.createMaintenanceTask(payload);
      }

      setShowTaskModal(false);
      await fetchData();
    } catch (err) {
      console.error('Error saving maintenance task:', err);
      setError(err.response?.data?.message || 'Failed to save maintenance task.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Delete this maintenance task?')) return;

    try {
      await renewableService.deleteMaintenanceTask(taskId);
      await fetchData();
    } catch (err) {
      console.error('Error deleting maintenance task:', err);
      setError('Failed to delete maintenance task.');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const sourceName = (task) => task.sourceId?.sourceName || 'Unknown Source';

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">🛠️ Maintenance Planner</h2>
          <p className="text-gray-600 text-sm mt-1">Plan, track, and resolve scheduled and overdue maintenance tasks.</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            Refresh
          </button>
          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            + New Task
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">{error}</div>
      )}

      {dueSoonCount > 0 && (
        <div className="bg-amber-50 border border-amber-300 rounded-lg p-4">
          <p className="font-semibold text-amber-800">Reminder: {dueSoonCount} task(s) due within the next 48 hours.</p>
          <p className="text-amber-700 text-sm mt-1">Keep reminders enabled and complete tasks to avoid overdue statuses.</p>
        </div>
      )}

      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white rounded-xl shadow p-4 border-l-4 border-blue-500">
            <p className="text-sm text-gray-600">Scheduled</p>
            <p className="text-2xl font-bold text-gray-800">{summary.totalScheduled}</p>
          </div>
          <div className="bg-white rounded-xl shadow p-4 border-l-4 border-red-500">
            <p className="text-sm text-gray-600">Overdue</p>
            <p className="text-2xl font-bold text-red-700">{summary.overdue}</p>
          </div>
          <div className="bg-white rounded-xl shadow p-4 border-l-4 border-amber-500">
            <p className="text-sm text-gray-600">Due This Week</p>
            <p className="text-2xl font-bold text-amber-700">{summary.dueThisWeek}</p>
          </div>
          <div className="bg-white rounded-xl shadow p-4 border-l-4 border-emerald-500">
            <p className="text-sm text-gray-600">Completed This Month</p>
            <p className="text-2xl font-bold text-emerald-700">{summary.completedThisMonth}</p>
          </div>
          <div className="bg-white rounded-xl shadow p-4 border-l-4 border-indigo-500">
            <p className="text-sm text-gray-600">Next Task</p>
            <p className="text-sm font-semibold text-gray-800">{summary.nextTask?.sourceName || 'None'}</p>
            <p className="text-xs text-gray-500">{summary.nextTask ? `${formatDate(summary.nextTask.scheduledDate)} • ${summary.nextTask.taskType}` : 'No pending task'}</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-lg p-4">
        <h3 className="text-lg font-bold text-gray-800 mb-3">📆 Next 14 Days Calendar Strip</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {calendarStrip.map((day) => (
            <div key={day.dayKey} className="rounded-lg border border-gray-200 p-3 bg-gray-50">
              <p className="text-xs text-gray-500">{day.day.toLocaleDateString(undefined, { weekday: 'short' })}</p>
              <p className="text-sm font-semibold text-gray-800">{day.day.toLocaleDateString()}</p>
              <p className="text-xs mt-2 text-gray-700">Total: {day.total}</p>
              <p className="text-xs text-blue-700">Scheduled: {day.scheduled}</p>
              <p className="text-xs text-red-700">Overdue: {day.overdue}</p>
              <p className="text-xs text-emerald-700">Done: {day.completed}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-700 mb-1">Status Filter</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="all">All</option>
              <option value="scheduled">Scheduled</option>
              <option value="overdue">Overdue</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Source Quick Filter</label>
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="all">All Sources</option>
              {sources.map((source) => (
                <option key={source._id} value={source._id}>{source.sourceName}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {statusColumns.map((column) => (
          <div key={column.key} className={`rounded-xl border-2 ${column.color} p-4`}>
            <h3 className="font-bold text-gray-800 mb-3">{column.icon} {column.label} ({groupedTasks[column.key].length})</h3>
            <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
              {groupedTasks[column.key].length === 0 ? (
                <p className="text-sm text-gray-500">No tasks</p>
              ) : groupedTasks[column.key].map((task) => (
                <div key={task._id} className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-gray-800">{task.taskType}</p>
                      <p className="text-xs text-gray-500">{sourceName(task)}</p>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => openEditModal(task)}
                        className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700 hover:bg-blue-200"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteTask(task._id)}
                        className="text-xs px-2 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  <div className="mt-2 text-xs text-gray-700 space-y-1">
                    <p>Scheduled: {formatDate(task.scheduledDate)}</p>
                    <p>Technician: {task.technician || 'Unassigned'}</p>
                    <p>Cost: Rs. {(task.cost || 0).toFixed(2)}</p>
                    {task.completedDate && <p>Completed: {formatDate(task.completedDate)}</p>}
                    {task.notes && <p className="text-gray-600">{task.notes}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <Modal
        isOpen={showTaskModal}
        onClose={() => setShowTaskModal(false)}
        title={editingTask ? 'Edit Maintenance Task' : 'Create Maintenance Task'}
      >
        <form onSubmit={handleSaveTask} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
              <select
                name="sourceId"
                value={formData.sourceId}
                onChange={handleFormChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                required
              >
                <option value="">Select Source</option>
                {sources.map((source) => (
                  <option key={source._id} value={source._id}>{source.sourceName}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Task Type</label>
              <select
                name="taskType"
                value={formData.taskType}
                onChange={handleFormChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                required
              >
                {taskTypeOptions.map((taskType) => (
                  <option key={taskType} value={taskType}>{taskType}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Scheduled Date</label>
              <input
                type="date"
                name="scheduledDate"
                value={formData.scheduledDate}
                onChange={handleFormChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleFormChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="scheduled">Scheduled</option>
                <option value="overdue">Overdue</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Completed Date</label>
              <input
                type="date"
                name="completedDate"
                value={formData.completedDate}
                onChange={handleFormChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Technician</label>
              <input
                type="text"
                name="technician"
                value={formData.technician}
                onChange={handleFormChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="Technician name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cost (Rs.)</label>
              <input
                type="number"
                name="cost"
                min="0"
                step="0.01"
                value={formData.cost}
                onChange={handleFormChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            <div className="flex items-center gap-2 pt-7">
              <input
                id="reminderSent"
                type="checkbox"
                name="reminderSent"
                checked={formData.reminderSent}
                onChange={handleFormChange}
                className="rounded"
              />
              <label htmlFor="reminderSent" className="text-sm text-gray-700">Reminder sent</label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              name="notes"
              rows="3"
              value={formData.notes}
              onChange={handleFormChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="Task notes..."
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowTaskModal(false)}
              className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-60"
            >
              {submitting ? 'Saving...' : editingTask ? 'Update Task' : 'Create Task'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default MaintenancePlanner;
