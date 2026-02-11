import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { deviceService } from '../../services/api';

const DevicesList = () => {
	const [devices, setDevices] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

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

	if (loading) return <div className="flex justify-center items-center h-48"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>;
	if (error) return <div className="text-red-600">{error}</div>;

	return (
		<div>
			<div className="flex justify-between items-center mb-6">
				<h1 className="text-3xl font-bold text-gray-900">Devices</h1>
				<Link to="/devices/new" className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg">Add Device</Link>
			</div>

			{devices.length === 0 ? (
				<div className="text-center py-12">
					<h3 className="text-xl text-gray-600 mb-4">No devices found</h3>
					<Link to="/devices/new" className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg">Create Your First Device</Link>
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
											<Link to={`/devices/edit/${device.deviceId || device._id}`} className="text-primary-600 hover:text-primary-900">Edit</Link>
											<button onClick={() => handleDelete(device.deviceId)} className="text-danger-600 hover:text-danger-900">Delete</button>
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
