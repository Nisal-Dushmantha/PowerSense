import React, { useState, useEffect } from 'react';
import { deviceService } from '../../services/api';
import CreateDeviceModal from './CreateDeviceModal';
import EditDeviceModal from './EditDeviceModal';
import { Link } from 'react-router-dom';

const DevicesList = () => {
	const [devices, setDevices] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [showModal, setShowModal] = useState(false);
	const [editModalOpen, setEditModalOpen] = useState(false);
	const [editDeviceId, setEditDeviceId] = useState(null);
	const [searchTerm, setSearchTerm] = useState('');

	   // Filter devices based on search term
	   const filteredDevices = devices.filter(device => 
		   device.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
		   device.type.toLowerCase().includes(searchTerm.toLowerCase())
	   );

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
			   <div className="flex items-center space-x-4">
				   {/* Search Bar */}
				   <div className="relative">
					   <input
						   type="text"
					   placeholder="Search"
						   value={searchTerm}
						   onChange={(e) => setSearchTerm(e.target.value)}
						   className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
					   />
					   <svg 
						   className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" 
						   fill="none" 
						   stroke="currentColor" 
						   viewBox="0 0 24 24"
					   >
						   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
					   </svg>
				   </div>
				   <Link
					   to="/devices/charts"
					   className="btn-secondary min-w-[120px] flex items-center space-x-2"
				   >
					   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
					   </svg>
					   <span>View Charts</span>
				   </Link>
				   <button
					   className="btn-primary min-w-[120px]"
					   onClick={() => setShowModal(true)}
				   >
					   + Add Device
				   </button>
			   </div>
				   </div>
		   {filteredDevices.length === 0 && devices.length > 0 ? (
			   <div className="text-center py-12">
				   <h3 className="text-xl text-gray-600 mb-4">No devices found matching "{searchTerm}"</h3>
			   </div>
		   ) : filteredDevices.length === 0 ? (
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
				   <>
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
								   {filteredDevices.map(device => (
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

					   {/* Summary Section */}
					   <div className="mt-6 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-6 border border-gray-200">
						   <h3 className="text-lg font-semibold text-gray-800 mb-4">Energy Consumption Summary</h3>
						   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							   <div className="bg-white rounded-lg p-4 shadow-sm border border-green-200">
								   <div className="flex items-center">
									   <div className="p-2 bg-green-100 rounded-lg">
										   <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
										   </svg>
									   </div>
									   <div className="ml-4">
										   <p className="text-sm font-medium text-gray-600">Total Daily Consumption</p>
										   <p className="text-2xl font-bold text-green-600">
											   {filteredDevices.reduce((sum, device) => {
												   const dailyKwh = (device.powerRating * device.expectedDailyUsage) / 1000;
												   return sum + dailyKwh;
											   }, 0).toFixed(3)} kWh
										   </p>
									   </div>
								   </div>
							   </div>
							   <div className="bg-white rounded-lg p-4 shadow-sm border border-blue-200">
								   <div className="flex items-center">
									   <div className="p-2 bg-blue-100 rounded-lg">
										   <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
										   </svg>
									   </div>
									   <div className="ml-4">
										   <p className="text-sm font-medium text-gray-600">Total Monthly Consumption</p>
										   <p className="text-2xl font-bold text-blue-600">
											   {filteredDevices.reduce((sum, device) => {
												   const dailyKwh = (device.powerRating * device.expectedDailyUsage) / 1000;
												   const monthlyKwh = dailyKwh * 30;
												   return sum + monthlyKwh;
											   }, 0).toFixed(3)} kWh
										   </p>
									   </div>
								   </div>
							   </div>
						   </div>
						   <div className="mt-4 text-sm text-gray-600">
							   <p><strong>Note:</strong> Calculations are based on expected daily usage hours and power ratings of your devices. Monthly consumption assumes 30 days per month.</p>
						   </div>
					   </div>
				   </>
			   )}
		   </div>
	   );
};

export default DevicesList;
