import React, { useState, useEffect } from 'react';
import { deviceService } from '../../services/api';
import CreateDeviceModal from './CreateDeviceModal';
import EditDeviceModal from './EditDeviceModal';
import { Link } from 'react-router-dom';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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

const handleDownloadPDF = () => {
	   if (devices.length === 0) {
		   alert('No devices available to generate a report.');
		   return;
	   }

	   const doc = new jsPDF();
	   const pageW = doc.internal.pageSize.width;
	   const pageH = doc.internal.pageSize.height;

	   // ── Color palette ──────────────────────────────────────────────
	   const navy    = [25, 50, 85];
	   const blue    = [0, 120, 180];
	   const green   = [40, 125, 70];
	   const amber   = [200, 130, 25];
	   const white   = [255, 255, 255];
	   const lightBg = [248, 250, 252];
	   const border  = [220, 225, 235];
	   const dark    = [25, 25, 25];
	   const mid     = [80, 80, 80];
	   const light   = [130, 130, 130];

	   // ── Header bar ─────────────────────────────────────────────────
	   doc.setFillColor(...navy);
	   doc.rect(0, 0, pageW, 40, 'F');
	   doc.setFillColor(...blue);
	   doc.rect(0, 37, pageW, 3, 'F');

	   doc.setTextColor(...white);
	   doc.setFont('helvetica', 'bold');
	   doc.setFontSize(24);
	   doc.text('POWERSENSE', 14, 18);
	   doc.setFont('helvetica', 'normal');
	   doc.setFontSize(10);
	   doc.text('Smart Electricity Management', 14, 28);

	   doc.setFont('helvetica', 'bold');
	   doc.setFontSize(14);
	   doc.text('DEVICE CONSUMPTION REPORT', pageW - 14, 18, { align: 'right' });
	   doc.setFont('helvetica', 'normal');
	   doc.setFontSize(9);
	   const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
	   doc.text(`Generated: ${today}`, pageW - 14, 28, { align: 'right' });

	   // ── Compute statistics ─────────────────────────────────────────
	   const totalDevices   = devices.length;
	   const totalDailyKwh  = devices.reduce((s, d) => s + (d.dailyKwh  || 0), 0);
	   const totalMonthlyKwh = devices.reduce((s, d) => s + (d.monthlyKwh || 0), 0);
	   const totalPowerW    = devices.reduce((s, d) => s + (d.powerRating || 0), 0);

	   // Device type breakdown
	   const typeMap = {};
	   devices.forEach(d => {
		   if (!typeMap[d.type]) typeMap[d.type] = { count: 0, dailyKwh: 0, monthlyKwh: 0 };
		   typeMap[d.type].count++;
		   typeMap[d.type].dailyKwh  += d.dailyKwh  || 0;
		   typeMap[d.type].monthlyKwh += d.monthlyKwh || 0;
	   });

	   // ── Summary title ──────────────────────────────────────────────
	   doc.setTextColor(...dark);
	   doc.setFont('helvetica', 'bold');
	   doc.setFontSize(15);
	   doc.text('SUMMARY OVERVIEW', 14, 56);
	   doc.setFillColor(...navy);
	   doc.rect(14, 59, pageW - 28, 1.2, 'F');

	   // ── 4 KPI cards ───────────────────────────────────────────────
	   const cardY = 64;
	   const cardH = 34;
	   const cardW = (pageW - 28 - 9) / 4;
	   const kpis = [
		   { label: 'Total Devices',       value: totalDevices.toString(),                    unit: 'Registered',            color: navy  },
		   { label: 'Total Power Rating',  value: `${(totalPowerW / 1000).toFixed(2)}K`,      unit: 'Watts Total',           color: blue  },
		   { label: 'Daily Consumption',   value: `${totalDailyKwh.toFixed(2)}`,              unit: 'kWh / Day',             color: amber },
		   { label: 'Monthly Consumption', value: `${(totalMonthlyKwh / 1000).toFixed(2)}K`,  unit: 'kWh / Month',           color: green },
	   ];

	   kpis.forEach((k, i) => {
		   const x = 14 + i * (cardW + 3);
		   doc.setFillColor(220, 220, 220);
		   doc.roundedRect(x + 0.8, cardY + 0.8, cardW, cardH, 3, 3, 'F');
		   doc.setFillColor(...white);
		   doc.roundedRect(x, cardY, cardW, cardH, 3, 3, 'F');
		   doc.setFillColor(...k.color);
		   doc.roundedRect(x, cardY, cardW, 3, 3, 3, 'F');
		   doc.setDrawColor(...border);
		   doc.setLineWidth(0.3);
		   doc.roundedRect(x, cardY, cardW, cardH, 3, 3, 'S');
		   doc.setTextColor(...light);
		   doc.setFontSize(8);
		   doc.setFont('helvetica', 'normal');
		   doc.text(k.label, x + 4, cardY + 11);
		   doc.setTextColor(...k.color);
		   doc.setFontSize(15);
		   doc.setFont('helvetica', 'bold');
		   doc.text(k.value, x + 4, cardY + 23);
		   doc.setTextColor(...mid);
		   doc.setFontSize(7.5);
		   doc.setFont('helvetica', 'normal');
		   doc.text(k.unit, x + 4, cardY + 30);
	   });

	   // ── Two-column: Analytics + Type Breakdown ──────────────────
	   const secY = cardY + cardH + 12;

	   // LEFT: Performance Analytics
	   doc.setTextColor(...dark);
	   doc.setFont('helvetica', 'bold');
	   doc.setFontSize(12);
	   doc.text('PERFORMANCE ANALYTICS', 14, secY);
	   doc.setFillColor(...navy);
	   doc.rect(14, secY + 2, 88, 1, 'F');

	   const avgDaily   = totalDailyKwh / totalDevices;
	   const avgMonthly = totalMonthlyKwh / totalDevices;
	   const avgPower   = totalPowerW / totalDevices;

	   autoTable(doc, {
		   startY: secY + 6,
		   head: [['Metric', 'Value', 'Info']],
		   body: [
			   ['Total Devices',       `${totalDevices}`,              'Registered'],
			   ['Avg Power Rating',    `${avgPower.toFixed(0)} W`,     'Per Device'],
			   ['Avg Daily Usage',     `${avgDaily.toFixed(3)} kWh`,   'Per Device'],
			   ['Avg Monthly Usage',   `${avgMonthly.toFixed(2)} kWh`, 'Per Device'],
		   ],
		   theme: 'plain',
		   headStyles: { fillColor: navy, textColor: white, fontStyle: 'bold', fontSize: 9, cellPadding: { top: 4, bottom: 4, left: 4, right: 4 } },
		   bodyStyles: { fontSize: 8.5, cellPadding: { top: 3.5, bottom: 3.5, left: 4, right: 4 }, textColor: dark },
		   alternateRowStyles: { fillColor: lightBg },
		   columnStyles: {
			   0: { cellWidth: 40, fontStyle: 'bold' },
			   1: { cellWidth: 26, halign: 'right', textColor: blue, fontStyle: 'bold' },
			   2: { cellWidth: 22, halign: 'center', textColor: mid },
		   },
		   margin: { left: 14, right: 108 },
		   styles: { lineColor: border, lineWidth: 0.2 },
	   });

	   // RIGHT: Device Type Breakdown
	   const rightX = 108;
	   doc.setTextColor(...dark);
	   doc.setFont('helvetica', 'bold');
	   doc.setFontSize(12);
	   doc.text('BY DEVICE TYPE', rightX, secY);
	   doc.setFillColor(...navy);
	   doc.rect(rightX, secY + 2, 88, 1, 'F');

	   const typeEntries = Object.entries(typeMap);
	   typeEntries.forEach(([type, data], i) => {
		   const y = secY + 8 + i * 28;
		   if (y + 24 > pageH - 20) return;
		   const accent = [blue, green, amber, navy][i % 4];
		   doc.setFillColor(...white);
		   doc.roundedRect(rightX, y, 88, 24, 2, 2, 'F');
		   doc.setFillColor(...accent);
		   doc.roundedRect(rightX, y, 3.5, 24, 1, 1, 'F');
		   doc.setDrawColor(...border);
		   doc.setLineWidth(0.2);
		   doc.roundedRect(rightX, y, 88, 24, 2, 2, 'S');
		   doc.setTextColor(...mid);
		   doc.setFontSize(8);
		   doc.setFont('helvetica', 'normal');
		   doc.text(`${type}  (${data.count} device${data.count > 1 ? 's' : ''})`, rightX + 8, y + 7);
		   doc.setTextColor(...accent);
		   doc.setFontSize(11);
		   doc.setFont('helvetica', 'bold');
		   doc.text(`${data.dailyKwh.toFixed(3)} kWh/day`, rightX + 8, y + 16);
		   doc.setTextColor(...mid);
		   doc.setFontSize(8);
		   doc.setFont('helvetica', 'normal');
		   doc.text(`${data.monthlyKwh.toFixed(2)} kWh/month`, rightX + 8, y + 22);
	   });

	   // ── Detailed devices table ─────────────────────────────────────
	   const tableStartY = doc.lastAutoTable.finalY + 16;

	   doc.setTextColor(...dark);
	   doc.setFont('helvetica', 'bold');
	   doc.setFontSize(12);
	   doc.text('DETAILED DEVICE RECORDS', 14, tableStartY);
	   doc.setFillColor(...navy);
	   doc.rect(14, tableStartY + 2, pageW - 28, 1, 'F');

	   const sortedDevices = [...devices].sort((a, b) => a.name.localeCompare(b.name));

	   autoTable(doc, {
		   startY: tableStartY + 7,
		   head: [['#', 'Device ID', 'Name', 'Type', 'Power (W)', 'Daily Use (h)', 'Daily (kWh)', 'Monthly (kWh)']],
		   body: sortedDevices.map((d, idx) => [
			   idx + 1,
			   d.deviceId || d._id,
			   d.name,
			   d.type,
			   (d.powerRating || 0).toLocaleString(),
			   (d.expectedDailyUsage || 0).toLocaleString(),
			   (d.dailyKwh || 0).toFixed(3),
			   (d.monthlyKwh || 0).toFixed(3),
		   ]),
		   theme: 'plain',
		   headStyles: { fillColor: navy, textColor: white, fontStyle: 'bold', fontSize: 9, cellPadding: { top: 5, bottom: 5, left: 4, right: 4 } },
		   bodyStyles: { fontSize: 8.5, cellPadding: { top: 4, bottom: 4, left: 4, right: 4 }, textColor: dark },
		   alternateRowStyles: { fillColor: lightBg },
		   columnStyles: {
			   0: { cellWidth: 9,  halign: 'center', textColor: light },
			   1: { cellWidth: 28, fontStyle: 'bold', textColor: blue },
			   2: { cellWidth: 30 },
			   3: { cellWidth: 24, halign: 'center' },
			   4: { cellWidth: 20, halign: 'right', fontStyle: 'bold' },
			   5: { cellWidth: 20, halign: 'right' },
			   6: { cellWidth: 22, halign: 'right', textColor: green, fontStyle: 'bold' },
			   7: { cellWidth: 22, halign: 'right', textColor: blue,  fontStyle: 'bold' },
		   },
		   margin: { left: 14, right: 14 },
		   styles: { lineColor: border, lineWidth: 0.2 },
		   showHead: 'everyPage',
	   });

	   // ── Footer on every page ───────────────────────────────────────
	   const totalPages = doc.internal.getNumberOfPages();
	   for (let p = 1; p <= totalPages; p++) {
		   doc.setPage(p);
		   doc.setFillColor(...navy);
		   doc.rect(0, pageH - 14, pageW, 14, 'F');
		   doc.setFillColor(...blue);
		   doc.rect(0, pageH - 14, pageW, 2, 'F');
		   doc.setTextColor(...white);
		   doc.setFont('helvetica', 'bold');
		   doc.setFontSize(8);
		   doc.text('POWERSENSE', 14, pageH - 6);
		   doc.setFont('helvetica', 'normal');
		   doc.setFontSize(6);
		   doc.text('Smart Electricity Management', 14, pageH - 2);
		   const pg = `Page ${p} of ${totalPages}`;
		   doc.setFontSize(7);
		   doc.text(pg, pageW - 14, pageH - 6, { align: 'right' });
		   doc.setFontSize(6);
		   doc.setTextColor(200, 200, 200);
		   doc.text('Computer-generated report. No signature required.', pageW - 14, pageH - 2, { align: 'right' });
	   }

	   // ── Save ───────────────────────────────────────────────────────
	   const filename = `PowerSense_Devices_Report_${new Date().toISOString().slice(0, 10)}.pdf`;
	   doc.save(filename);
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
					   className="btn-secondary min-w-[120px] flex items-center space-x-2"
					   onClick={handleDownloadPDF}
				   >
					   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
					   </svg>
					   <span>PDF Report</span>
				   </button>
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
												   const dailyKwh = device.dailyKwh || 0;
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
												   const monthlyKwh = device.monthlyKwh || 0;
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
