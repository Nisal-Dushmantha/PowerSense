import React, { useCallback, useEffect, useState } from 'react';
import { adminService } from '../../services/api';

const AdminDashboard = () => {
  const [summary, setSummary] = useState(null);
  const [users, setUsers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    search: '',
    role: '',
    status: ''
  });

  const fetchAdminData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const [summaryRes, usersRes, logsRes] = await Promise.all([
        adminService.getSummary(),
        adminService.getUsers(filters),
        adminService.getAuditLogs({ limit: 15 })
      ]);

      setSummary(summaryRes.data?.data || null);
      setUsers(usersRes.data?.data || []);
      setAuditLogs(logsRes.data?.data || []);
    } catch (err) {
      console.error('Admin dashboard fetch error:', err);
      setError(err.response?.data?.message || 'Failed to load admin data');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const getActionLabel = (action) => {
    if (action === 'role-change') return 'Role Change';
    if (action === 'status-change') return 'Status Change';
    return action;
  };

  const getActionBadge = (action) => {
    if (action === 'role-change') return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300';
    if (action === 'status-change') return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300';
    return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200';
  };

  const metricCards = [
    {
      label: 'Total Users',
      value: summary?.users?.total || 0,
      icon: '👥',
      tone: 'from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200/60 dark:border-blue-800/60'
    },
    {
      label: 'Active Users',
      value: summary?.users?.active || 0,
      icon: '✅',
      tone: 'from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 border-emerald-200/60 dark:border-emerald-800/60'
    },
    {
      label: 'Admin Users',
      value: summary?.users?.admins || 0,
      icon: '🛡️',
      tone: 'from-purple-50 to-fuchsia-50 dark:from-purple-900/20 dark:to-fuchsia-900/20 border-purple-200/60 dark:border-purple-800/60'
    },
    {
      label: 'Energy Readings',
      value: summary?.modules?.consumptionReadings || 0,
      icon: '⚡',
      tone: 'from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-200/60 dark:border-amber-800/60'
    }
  ];

  useEffect(() => {
    fetchAdminData();
  }, [fetchAdminData]);

  const handleRoleChange = async (userId, role) => {
    try {
      setUpdatingId(userId);
      await adminService.updateUserRole(userId, role);
      await fetchAdminData();
    } catch (err) {
      console.error('Update role error:', err);
      alert(err.response?.data?.message || 'Failed to update role');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleStatusToggle = async (userId, currentStatus) => {
    try {
      setUpdatingId(userId);
      await adminService.updateUserStatus(userId, !currentStatus);
      await fetchAdminData();
    } catch (err) {
      console.error('Update status error:', err);
      alert(err.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-24">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <span className="ml-3 text-textSecondary dark:text-gray-400">Loading admin console...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <p className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary mb-3">
              ADMIN CONTROL CENTER
            </p>
            <h1 className="text-3xl md:text-4xl font-bold text-textPrimary dark:text-gray-100">Platform Administration</h1>
            <p className="text-textSecondary dark:text-gray-400 mt-2">
              Manage user access, monitor module activity, and review audit events in one place.
            </p>
          </div>
          <button
            onClick={fetchAdminData}
            className="self-start px-4 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm font-medium text-textPrimary dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Refresh Data
          </button>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
          {metricCards.map((card) => (
            <div
              key={card.label}
              className={`rounded-2xl p-5 border bg-gradient-to-br ${card.tone} shadow-sm`}
            >
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-medium text-textSecondary dark:text-gray-300">{card.label}</p>
                <span className="text-xl">{card.icon}</span>
              </div>
              <p className="text-3xl font-bold text-textPrimary dark:text-gray-100">{card.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input
                  type="text"
                  placeholder="Search by name or email"
                  value={filters.search}
                  onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <select
                  value={filters.role}
                  onChange={(e) => setFilters((prev) => ({ ...prev, role: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">All Roles</option>
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
              <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-textPrimary dark:text-gray-100">User Management</h2>
                  <p className="text-sm text-textSecondary dark:text-gray-400">Promote, demote, activate, or deactivate platform users</p>
                </div>
                <span className="text-sm font-medium text-textSecondary dark:text-gray-400">{users.length} records</span>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50 dark:bg-gray-900/40">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs uppercase tracking-wide text-textSecondary dark:text-gray-400">User</th>
                      <th className="text-left px-4 py-3 text-xs uppercase tracking-wide text-textSecondary dark:text-gray-400">Role</th>
                      <th className="text-left px-4 py-3 text-xs uppercase tracking-wide text-textSecondary dark:text-gray-400">Status</th>
                      <th className="text-left px-4 py-3 text-xs uppercase tracking-wide text-textSecondary dark:text-gray-400">Joined</th>
                      <th className="text-left px-4 py-3 text-xs uppercase tracking-wide text-textSecondary dark:text-gray-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user._id} className="border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50/70 dark:hover:bg-gray-700/20 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-medium text-textPrimary dark:text-gray-100">{user.firstName} {user.lastName}</p>
                          <p className="text-sm text-textSecondary dark:text-gray-400">{user.email}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 text-xs rounded-full font-semibold ${user.role === 'admin' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'}`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 text-xs rounded-full font-semibold ${user.isActive ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'}`}>
                            {user.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-textSecondary dark:text-gray-400">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              onClick={() => handleRoleChange(user._id, user.role === 'admin' ? 'user' : 'admin')}
                              disabled={updatingId === user._id}
                              className="px-3 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                            >
                              {updatingId === user._id ? 'Updating...' : user.role === 'admin' ? 'Set User' : 'Set Admin'}
                            </button>
                            <button
                              onClick={() => handleStatusToggle(user._id, user.isActive)}
                              disabled={updatingId === user._id}
                              className="px-3 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                            >
                              {updatingId === user._id ? 'Updating...' : user.isActive ? 'Deactivate' : 'Activate'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {users.length === 0 && (
                      <tr>
                        <td colSpan="5" className="px-4 py-10 text-center text-textSecondary dark:text-gray-400">No users found for current filters</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm h-fit">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-textPrimary dark:text-gray-100">Recent Admin Activity</h2>
              <p className="text-sm text-textSecondary dark:text-gray-400">Audit trail of role and status updates</p>
            </div>
            <div className="max-h-[640px] overflow-auto divide-y divide-gray-100 dark:divide-gray-700">
              {auditLogs.map((log) => (
                <div key={log._id} className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/20 transition-colors">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className={`px-2 py-1 text-[11px] rounded-full font-semibold ${getActionBadge(log.action)}`}>
                      {getActionLabel(log.action)}
                    </span>
                    <span className="text-xs text-textSecondary dark:text-gray-400">
                      {new Date(log.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-textPrimary dark:text-gray-100 font-medium">
                    {log.adminUser?.firstName} {log.adminUser?.lastName}
                  </p>
                  <p className="text-xs text-textSecondary dark:text-gray-400 mt-0.5">
                    Updated {log.targetUser?.firstName} {log.targetUser?.lastName}
                  </p>
                  <p className="text-xs mt-2 text-textSecondary dark:text-gray-300">
                    {String(log.previousValue)} <span className="mx-1">→</span> {String(log.newValue)}
                  </p>
                </div>
              ))}
              {auditLogs.length === 0 && (
                <div className="px-4 py-10 text-center text-textSecondary dark:text-gray-400">
                  No audit activity yet
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
