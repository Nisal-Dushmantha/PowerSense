import React, { useState, useEffect } from 'react';
import { deviceService } from '../../services/api';
import CreateDeviceModal from './CreateDeviceModal';
import EditDeviceModal from './EditDeviceModal';

const DevicesList = () => {
	const [devices, setDevices] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [showModal, setShowModal] = useState(false);
	const [editModalOpen, setEditModalOpen] = useState(false);
	const [editDeviceId, setEditDeviceId] = useState(null);

	   useEffect(() => {
		   fetchDevices();
	   }, []);

	   const fetchDevices = async () => {
		   try {
			   setLoading(true);
			   const res = await deviceService.getAllDevices();
			   // Expect backend returns array or { data: { devices } }
			   const payload = res.data.data || res.data;
			   setDevices(payload.devices || payload || []);
			   setError(null);
		   } catch (err) {
			   console.error('Error fetching devices', err);
			   setError('Failed to load devices');
		   } finally {
			   setLoading(false);
		   }
	   };

	   const handleDelete = async (deviceId) => {
		   if (!window.confirm('Delete this device?')) return;
		   try {
			   await deviceService.deleteDevice(deviceId);
			   setDevices(devices.filter(d => d.deviceId !== deviceId));
		   } catch (err) {
			   console.error('Error deleting device', err);
			   setError('Failed to delete device');
		   }
	   };

	   const handleDeviceCreated = (newDevice) => {
		   fetchDevices();
	   };

	   const handleEditDevice = (deviceId) => {
		   setEditDeviceId(deviceId);
		   setEditModalOpen(true);
	   };

	   const handleDeviceUpdated = () => {
		   fetchDevices();
	   };

	if (loading) return <div className="flex justify-center items-center h-48"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>;
	if (error) return <div className="text-red-600">{error}</div>;

	   return (
		   <div>
			   <CreateDeviceModal
				   isOpen={showModal}
				   onClose={() => setShowModal(false)}
				   onDeviceCreated={handleDeviceCreated}
			   />
			   <EditDeviceModal
				   isOpen={editModalOpen}
				   onClose={() => setEditModalOpen(false)}
				   deviceId={editDeviceId}
				   onDeviceUpdated={handleDeviceUpdated}
			   />
			   <div className="flex justify-between items-center mb-6">
				   <h1 className="text-3xl font-bold text-gray-900">Devices</h1>
				   <button
					   className="btn-primary min-w-[120px]"
					   onClick={() => setShowModal(true)}
				   >
					   + Add Device
				   </button>
			   </div>

			   {devices.length === 0 ? (
				   <div className="text-center py-12">
					   <h3 className="text-xl text-gray-600 mb-4">No devices found</h3>
					   <button
						   className="btn-primary min-w-[120px]"
						   onClick={() => setShowModal(true)}
					   >
						   Create Your First Device
					   </button>
				   </div>
			   ) : (
				   <div className="bg-white shadow-lg rounded-lg overflow-hidden">
					   <div className="overflow-x-auto">
						   <table className="min-w-full divide-y divide-gray-200">
							   <thead className="bg-gray-50">
								   <tr>
									   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Device ID</th>
									   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
									   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
									   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Power (W)</th>
									   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Daily (hrs)</th>
									   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
								   </tr>
							   </thead>
							   <tbody className="bg-white divide-y divide-gray-200">
								   {devices.map(device => (
									   <tr key={device._id || device.deviceId} className="hover:bg-gray-50">
										   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{device.deviceId || device._id}</td>
										   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{device.name}</td>
										   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{device.type}</td>
										   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{device.powerRating}</td>
										   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{device.expectedDailyUsage}</td>
										   <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
											   <button
												   className="btn-ghost btn-sm text-secondary hover:text-primary dark:text-secondary dark:hover:text-primary-light"
												   onClick={() => handleEditDevice(device.deviceId || device._id)}
											   >
												   <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
													   <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
												   </svg>
											   </button>
											   <button
												   onClick={() => handleDelete(device.deviceId)}
												   className="btn-ghost btn-sm text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
											   >
												   <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
													   <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
												   </svg>
											   </button>
										   </td>
									   </tr>
								   ))}
							   </tbody>
						   </table>
					   </div>
				   </div>
			   )}
		   </div>
	   );
};

export default DevicesList;
