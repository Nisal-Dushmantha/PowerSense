import React, { useState, useEffect } from 'react';
import { deviceService } from '../../services/api';
import CreateDeviceModal from './CreateDeviceModal';
import EditDeviceModal from './EditDeviceModal';
import { Link } from 'react-router-dom';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// ── CEB Sri Lanka Domestic Tariff (Category 1) ─────────────────────────────
// Slab-based: entire consumption billed at the slab rate it falls into.
// Source: Ceylon Electricity Board domestic tariff schedule.
const CEB_SLABS = [
  { max: 30,  rate: 7.85,   fixed: 30  },
  { max: 60,  rate: 10.00,  fixed: 60  },
  { max: 90,  rate: 27.75,  fixed: 90  },
  { max: 120, rate: 32.00,  fixed: 120 },
  { max: 180, rate: 45.00,  fixed: 240 },
  { max: 300, rate: 75.00,  fixed: 360 },
  { max: Infinity, rate: 100.00, fixed: 540 },
];
const VAT_RATE = 0.10; // 10% VAT

function calculateCEBBill(totalKwh) {
  const units = Math.ceil(totalKwh); // CEB rounds up to nearest whole unit
  const slab  = CEB_SLABS.find(s => units <= s.max);
  const energyCharge = units * slab.rate;
  const fixedCharge  = slab.fixed;
  const subtotal     = energyCharge + fixedCharge;
  const vat          = subtotal * VAT_RATE;
  const total        = subtotal + vat;
  return {
    units,
    slab,
    energyCharge: energyCharge.toFixed(2),
    fixedCharge:  fixedCharge.toFixed(2),
    vat:          vat.toFixed(2),
    total:        total.toFixed(2),
  };
}

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
			   <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Devices</h1>
			   <div className="flex items-center space-x-4">
				   {/* Search Bar */}
				   <div className="relative">
					   <input
						   type="text"
					   placeholder="Search"
						   value={searchTerm}
						   onChange={(e) => setSearchTerm(e.target.value)}
					   className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
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
					   className="btn-secondary min-w-[120px] flex items-center space-x-2 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:text-white"
				   >
					   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
					   </svg>
					   <span>View Charts</span>
				   </Link>
				   <button
					   className="btn-secondary min-w-[120px] flex items-center space-x-2 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:text-white"
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
				   <h3 className="text-xl text-gray-600 dark:text-gray-400 mb-4">No devices found matching \"{searchTerm}\"</h3>
			   </div>
		   ) : filteredDevices.length === 0 ? (
				   <div className="text-center py-12">
				   <h3 className="text-xl text-gray-600 dark:text-gray-400 mb-4">No devices found</h3>
					   <button
						   className="btn-primary min-w-[120px]"
						   onClick={() => setShowModal(true)}
					   >
						   Create Your First Device
					   </button>
				   </div>
			   ) : (
				   <>
			   <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden border border-gray-100 dark:border-gray-700">
				   <div className="overflow-x-auto">
					   <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
						   <thead className="bg-gray-50 dark:bg-gray-900">
									   <tr>
								   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Device ID</th>
								   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Name</th>
								   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
								   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Power (W)</th>
								   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Daily (hrs)</th>
								   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
									   </tr>
								   </thead>
								   <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
								   {filteredDevices.map(device => (
								   <tr key={device._id || device.deviceId} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
							   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{device.deviceId || device._id}</td>
							   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{device.name}</td>
							   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{device.type}</td>
							   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{device.powerRating}</td>
							   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{device.expectedDailyUsage}</td>
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
					   {(() => {
						   const totalDailyKwh   = filteredDevices.reduce((s, d) => s + (d.dailyKwh   || 0), 0);
						   const totalMonthlyKwh  = filteredDevices.reduce((s, d) => s + (d.monthlyKwh || 0), 0);
						   const bill = calculateCEBBill(totalMonthlyKwh);

						   return (
							   <div className="mt-6 space-y-4">

								   {/* ── Stat cards row ─────────────────────────── */}
								   <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
									   {/* Daily */}
									   <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 flex items-center gap-4">
										   <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-green-50 dark:bg-green-900/30 flex items-center justify-center">
											   <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/>
											   </svg>
										   </div>
										   <div>
											   <p className="text-xs text-gray-400 dark:text-gray-500 font-medium uppercase tracking-wide">Daily Usage</p>
											   <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{totalDailyKwh.toFixed(2)} <span className="text-sm font-normal text-gray-400 dark:text-gray-500">kWh</span></p>
										   </div>
									   </div>

									   {/* Monthly */}
									   <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 flex items-center gap-4">
										   <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
											   <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
											   </svg>
										   </div>
										   <div>
											   <p className="text-xs text-gray-400 dark:text-gray-500 font-medium uppercase tracking-wide">Monthly Usage</p>
											   <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{totalMonthlyKwh.toFixed(2)} <span className="text-sm font-normal text-gray-400 dark:text-gray-500">kWh</span></p>
										   </div>
									   </div>

									   {/* Estimated Bill highlight */}
									   <div className="bg-gradient-to-br from-green-500 to-emerald-600 dark:from-green-700 dark:to-emerald-800 rounded-2xl shadow-md p-5 flex items-center gap-4">
										   <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-white bg-opacity-20 flex items-center justify-center">
											   <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
												   <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/>
											   </svg>
										   </div>
										   <div>
											   <p className="text-xs text-green-100 font-medium uppercase tracking-wide">Est. Monthly Bill</p>
											   <p className="text-2xl font-bold text-white">Rs. {Number(bill.total).toLocaleString('en-LK', { minimumFractionDigits: 2 })}</p>
										   </div>
									   </div>
								   </div>

								   {/* ── CEB Bill Detail Card ────────────────────── */}
								   <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
									   {/* Card header */}
									   <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
										   <div className="flex items-center gap-2">
											   <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block"></span>
											   <h3 className="font-semibold text-gray-700 dark:text-gray-200">CEB Bill Estimate — Sri Lanka Domestic Tariff</h3>
										   </div>
										   <span className="text-xs bg-green-50 text-green-600 font-semibold px-3 py-1 rounded-full border border-green-200">
											   Tariff Block: Rs. {bill.slab.rate.toFixed(2)}/kWh
										   </span>
									   </div>

									   <div className="p-6 space-y-6">

										   {/* ── Bill breakdown ──────────────────────── */}
										   <div className="space-y-2">
										   <div className="flex items-center justify-between py-2.5 px-4 bg-gray-50 dark:bg-gray-900 rounded-xl">
											   <div className="flex items-center gap-2">
												   <div className="w-2 h-2 rounded-full bg-blue-400"></div>
												   <span className="text-sm text-gray-600 dark:text-gray-400">Energy Charge</span>
												   <span className="text-xs text-gray-400 dark:text-gray-500">({bill.units} kWh × Rs. {bill.slab.rate.toFixed(2)})</span>
											   </div>
											   <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">Rs. {Number(bill.energyCharge).toLocaleString('en-LK', { minimumFractionDigits: 2 })}</span>
											   </div>
										   <div className="flex items-center justify-between py-2.5 px-4 bg-gray-50 dark:bg-gray-900 rounded-xl">
											   <div className="flex items-center gap-2">
												   <div className="w-2 h-2 rounded-full bg-purple-400"></div>
												   <span className="text-sm text-gray-600 dark:text-gray-400">Fixed / Service Charge</span>
											   </div>
											   <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">Rs. {Number(bill.fixedCharge).toLocaleString('en-LK', { minimumFractionDigits: 2 })}</span>
											   </div>
										   <div className="flex items-center justify-between py-2.5 px-4 bg-gray-50 dark:bg-gray-900 rounded-xl">
											   <div className="flex items-center gap-2">
												   <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
												   <span className="text-sm text-gray-600 dark:text-gray-400">VAT (10%)</span>
											   </div>
											   <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">Rs. {Number(bill.vat).toLocaleString('en-LK', { minimumFractionDigits: 2 })}</span>
											   </div>
										   <div className="flex items-center justify-between py-3 px-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-xl">
											   <span className="font-bold text-green-700 dark:text-green-400">Estimated Total</span>
											   <span className="text-xl font-extrabold text-green-600 dark:text-green-400">Rs. {Number(bill.total).toLocaleString('en-LK', { minimumFractionDigits: 2 })}</span>
											   </div>
										   </div>

										   {/* ── Slab rate reference ─────────────────── */}
										   <div>
										   <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2">CEB Slab Rate Reference</p>
											   <div className="flex gap-1.5 flex-wrap">
												   {[
													   { label: '≤ 30',    rate: 7.85,   color: 'bg-green-100 text-green-700 border-green-200'  },
													   { label: '31–60',   rate: 10.00,  color: 'bg-lime-100 text-lime-700 border-lime-200'    },
													   { label: '61–90',   rate: 27.75,  color: 'bg-yellow-100 text-yellow-700 border-yellow-200'},
													   { label: '91–120',  rate: 32.00,  color: 'bg-amber-100 text-amber-700 border-amber-200'  },
													   { label: '121–180', rate: 45.00,  color: 'bg-orange-100 text-orange-700 border-orange-200'},
													   { label: '181–300', rate: 75.00,  color: 'bg-red-100 text-red-600 border-red-200'        },
													   { label: '> 300',   rate: 100.00, color: 'bg-red-200 text-red-700 border-red-300'        },
												   ].map(s => {
													   const active = Math.abs(bill.slab.rate - s.rate) < 0.01;
													   return (
													   <div key={s.label} className={`border rounded-lg px-3 py-2 text-center text-xs dark:border-gray-600 ${active ? 'ring-2 ring-green-500 bg-green-500 dark:bg-green-600 !text-white border-green-500 font-bold scale-105' : s.color} transition-transform`}>
															   <div className="font-semibold">{s.label} kWh</div>
															   <div className="mt-0.5">Rs. {s.rate.toFixed(2)}</div>
															   {active && <div className="mt-1 text-green-100 font-normal">← your block</div>}
														   </div>
													   );
												   })}
											   </div>
										   </div>

										   <p className="text-xs text-gray-400">* Based on CEB domestic tariff (Category 1). Assumes 30 days/month. Actual bill may differ due to fuel adjustment charges or meter reading date.</p>
									   </div>
								   </div>

								   <p className="text-xs text-gray-400 px-1">Consumption figures are based on the power ratings and expected daily usage hours of your devices.</p>
							   </div>
						   );
					   })()}
				   </>
			   )}
		   </div>
	   );
};

export default DevicesList;
