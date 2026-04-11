import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { renewableService } from '../../services/api';
import Modal from '../common/Modal';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const RenewableDashboard = () => {
  const [records, setRecords] = useState([]);
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingRecord, setDeletingRecord] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportFilter, setReportFilter] = useState({
    startDate: '',
    endDate: '',
    sourceId: ''
  });
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [formError, setFormError] = useState(null);
  const [formSuccess, setFormSuccess] = useState(null);
  const [formErrors, setFormErrors] = useState({});

  const weatherOptions = ['Sunny', 'Cloudy', 'Rainy', 'Windy', 'Stormy', 'Foggy', 'Mixed', 'Other'];

  const initialFormState = {
    source: '',
    recordDate: new Date().toISOString().split('T')[0],
    energyGenerated: '',
    energyUnit: 'kWh',
    peakPower: '',
    averagePower: '',
    operatingHours: '',
    efficiency: '',
    weatherCondition: 'Sunny',
    temperature: '',
    costSavings: '',
    notes: '',
    maintenancePerformed: false,
    issues: ''
  };

  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    fetchRecords();
    fetchSources();
  }, []);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const response = await renewableService.getRecords();
      setRecords(response.data.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch energy records');
      console.error('Error fetching records:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSources = async () => {
    try {
      const response = await renewableService.getSources({ status: 'Active' });
      setSources(response.data.data);
    } catch (err) {
      console.error('Error fetching sources:', err);
    }
  };

  const handleDelete = (record) => {
    setDeletingRecord(record);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!deletingRecord) return;
    
    try {
      await renewableService.deleteRecord(deletingRecord._id);
      setRecords(records.filter(record => record._id !== deletingRecord._id));
      setShowDeleteModal(false);
      setDeletingRecord(null);
    } catch (err) {
      setError('Failed to delete record');
      console.error('Error deleting record:', err);
      setShowDeleteModal(false);
      setDeletingRecord(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setDeletingRecord(null);
  };

  const handleAddNew = () => {
    setEditingRecord(null);
    setFormData(initialFormState);
    setFormError(null);
    setFormSuccess(null);
    setFormErrors({});
    setShowFormModal(true);
  };

  const handleEditRecord = (record) => {
    setEditingRecord(record);
    setFormData({
      source: record.source._id || record.source,
      recordDate: record.recordDate ? record.recordDate.split('T')[0] : '',
      energyGenerated: record.energyGenerated,
      energyUnit: record.energyUnit,
      peakPower: record.peakPower || '',
      averagePower: record.averagePower || '',
      operatingHours: record.operatingHours || '',
      efficiency: record.efficiency || '',
      weatherCondition: record.weatherCondition || 'Sunny',
      temperature: record.temperature || '',
      costSavings: record.costSavings || '',
      notes: record.notes || '',
      maintenancePerformed: record.maintenancePerformed || false,
      issues: record.issues || ''
    });
    setFormError(null);
    setFormSuccess(null);
    setFormErrors({});
    setShowFormModal(true);
  };

  const validateRecordField = (name, value) => {
    const errors = {};
    const selectedSource = sources.find(s => s._id === formData.source);

    switch (name) {
      case 'source':
        if (!value) {
          errors.source = 'Please select a renewable source';
        }
        break;

      case 'recordDate':
        if (!value) {
          errors.recordDate = 'Record date is required'; 
        } else if (new Date(value) > new Date()) {
          errors.recordDate = 'Record date cannot be in the future';
        } else if (selectedSource && selectedSource.installationDate) {
          const installDate = new Date(selectedSource.installationDate);
          if (new Date(value) < installDate) {
            errors.recordDate = 'Record date cannot be before source installation date';
          }
        }
        break;

      case 'energyGenerated':
        if (!value) {
          errors.energyGenerated = 'Energy generated is required';
        } else if (parseFloat(value) <= 0) {
          errors.energyGenerated = 'Energy generated must be greater than 0';
        } else if (parseFloat(value) > 1000000) {
          errors.energyGenerated = 'Energy generated value is too large';
        }
        break;

      case 'peakPower':
        if (value && parseFloat(value) < 0) {
          errors.peakPower = 'Peak power cannot be negative';
        } else if (value && parseFloat(value) > 1000000) {
          errors.peakPower = 'Peak power value is too large';
        }
        break;

      case 'averagePower':
        if (value && parseFloat(value) < 0) {
          errors.averagePower = 'Average power cannot be negative';
        } else if (value && formData.peakPower && parseFloat(value) > parseFloat(formData.peakPower)) {
          errors.averagePower = 'Average power cannot exceed peak power';
        }
        break;

      case 'operatingHours':
        if (value && (parseFloat(value) < 0 || parseFloat(value) > 24)) {
          errors.operatingHours = 'Operating hours must be between 0 and 24';
        }
        break;

      case 'efficiency':
        if (value && (parseFloat(value) < 0 || parseFloat(value) > 100)) {
          errors.efficiency = 'Efficiency must be between 0 and 100%';
        }
        break;

      case 'temperature':
        if (value && (parseFloat(value) < -100 || parseFloat(value) > 150)) {
          errors.temperature = 'Temperature must be between -100°C and 150°C';
        }
        break;

      case 'costSavings':
        if (value && parseFloat(value) < 0) {
          errors.costSavings = 'Cost savings cannot be negative';
        } else if (value && parseFloat(value) > 10000000) {
          errors.costSavings = 'Cost savings value is too large';
        }
        break;

      case 'notes':
        if (value && value.length > 500) {
          errors.notes = 'Notes must not exceed 500 characters';
        }
        break;

      case 'issues':
        if (value && value.length > 500) {
          errors.issues = 'Issues must not exceed 500 characters';
        }
        break;

      default:
        break;
    }

    return errors;
  };

  const handleFormInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }));

    // Clear error for this field when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }

    // Validate field on change
    const fieldErrors = validateRecordField(name, newValue);
    if (Object.keys(fieldErrors).length > 0) {
      setFormErrors(prev => ({ ...prev, ...fieldErrors }));
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    // Validate all fields
    const errors = {};
    Object.keys(formData).forEach(key => {
      const fieldErrors = validateRecordField(key, formData[key]);
      Object.assign(errors, fieldErrors);
    });

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setFormError('Please fix the errors in the form');
      return;
    }

    try {
      if (editingRecord) {
        await renewableService.updateRecord(editingRecord._id, formData);
        setFormSuccess('Energy record updated successfully!');
      } else {
        await renewableService.createRecord(formData);
        setFormSuccess('Energy record created successfully!');
      }
      
      fetchRecords();
      
      // Close modal after a short delay
      setTimeout(() => {
        setShowFormModal(false);
        setEditingRecord(null);
        setFormData(initialFormState);
        setFormSuccess(null);
      }, 1500);
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to save energy record');
      console.error('Error saving record:', err);
    }
  };

  const getSourceTypeIcon = (type) => {
    const icons = {
      Solar: '☀️',
      Wind: '🌪️',
      Hydro: '💧',
      Biomass: '🌿',
      Geothermal: '🌋',
      Other: '⚡'
    };
    return icons[type] || '⚡';
  };

  const getWeatherIcon = (weather) => {
    const icons = {
      Sunny: '☀️',
      Cloudy: '☁️',
      Rainy: '🌧️',
      Windy: '💨',
      Stormy: '⛈️',
      Foggy: '🌫️',
      Mixed: '⛅',
      Other: '🌤️'
    };
    return icons[weather] || '🌤️';
  };

  const downloadFile = (blob, filename) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const handleGenerateReport = async (reportType, format) => {
    setReportLoading(true);
    try {
      let response;
      const params = {
        ...reportFilter,
        reportType
      };

      // Remove empty params
      Object.keys(params).forEach(key => {
        if (!params[key]) delete params[key];
      });

      if (reportType === 'records') {
        if (format === 'pdf') {
          response = await renewableService.generateRecordsPDF(params);
          downloadFile(response.data, `energy-records-report-${Date.now()}.pdf`);
        } else {
          response = await renewableService.generateRecordsCSV(params);
          downloadFile(response.data, `energy-records-${Date.now()}.csv`);
        }
      } else if (reportType === 'sources') {
        if (format === 'pdf') {
          response = await renewableService.generateSourcesPDF(params);
          downloadFile(response.data, `renewable-sources-report-${Date.now()}.pdf`);
        } else {
          response = await renewableService.generateSourcesCSV(params);
          downloadFile(response.data, `renewable-sources-${Date.now()}.csv`);
        }
      } else if (reportType === 'summary') {
        response = await renewableService.generateSummaryPDF(params);
        downloadFile(response.data, `renewable-summary-report-${Date.now()}.pdf`);
      }

      setShowReportModal(false);
    } catch (err) {
      console.error('Error generating report:', err);
      setError('Failed to generate report. Please try again.');
    } finally {
      setReportLoading(false);
    }
  };

  const generateRecordsSummaryPDF = () => {
    if (records.length === 0) {
      alert('No renewable energy records available to generate a summary.');
      return;
    }

    const doc = new jsPDF();
    const pageW = doc.internal.pageSize.width;
    const pageH = doc.internal.pageSize.height;

    // ── Color palette ──────────────────────────────────────────────
    const navy    = [25, 50, 85];
    const green   = [34, 139, 34];
    const emerald = [16, 185, 129];
    const blue    = [59, 130, 246];
    const white   = [255, 255, 255];
    const lightBg = [248, 250, 252];
    const border  = [220, 225, 235];
    const dark    = [25, 25, 25];
    const mid     = [80, 80, 80];
    const light   = [130, 130, 130];

    // ── Header bar ─────────────────────────────────────────────────
    doc.setFillColor(...navy);
    doc.rect(0, 0, pageW, 40, 'F');
    doc.setFillColor(...emerald);
    doc.rect(0, 37, pageW, 3, 'F');

    doc.setTextColor(...white);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(24);
    doc.text('POWERSENSE', 14, 18);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('Smart Electricity Management', 14, 28);

    // Report label right-aligned
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('RENEWABLE ENERGY REPORT', pageW - 14, 18, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    doc.text(`Generated: ${today}`, pageW - 14, 28, { align: 'right' });

    // ── Compute statistics ─────────────────────────────────────────
    const totalRecords = records.length;
    const totalEnergy = records.reduce((s, r) => s + (r.energyGenerated || 0), 0);
    const totalSavings = records.reduce((s, r) => s + (r.costSavings || 0), 0);
    const avgEnergy = totalEnergy / totalRecords;
    const avgEfficiency = records.reduce((s, r) => s + (r.efficiency || 0), 0) / totalRecords;
    const recordsWithMaintenance = records.filter(r => r.maintenancePerformed).length;
    const activeSources = new Set(records.map(r => r.source?._id || r.source)).size;

    // ── Summary title ──────────────────────────────────────────────
    doc.setTextColor(...dark);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.text('SUMMARY OVERVIEW', 14, 56);
    doc.setFillColor(...navy);
    doc.rect(14, 59, pageW - 28, 1.2, 'F');

    // ── 4 KPI cards in one row ─────────────────────────────────────
    const cardY    = 64;
    const cardH    = 34;
    const cardW    = (pageW - 28 - 9) / 4;
    const kpis = [
      { label: 'Total Records',     value: totalRecords.toString(),                     unit: 'Entries',      color: navy  },
      { label: 'Energy Generated',  value: `${(totalEnergy / 1000).toFixed(2)}K`,       unit: 'kWh Produced', color: green },
      { label: 'Cost Savings',      value: `LKR ${(totalSavings / 1000).toFixed(1)}K`,  unit: 'Total Saved',  color: emerald },
      { label: 'Active Sources',    value: activeSources.toString(),                    unit: 'Sources',      color: blue }
    ];

    kpis.forEach((k, i) => {
      const x = 14 + i * (cardW + 3);
      // Shadow
      doc.setFillColor(220, 220, 220);
      doc.roundedRect(x + 0.8, cardY + 0.8, cardW, cardH, 3, 3, 'F');
      // Card
      doc.setFillColor(...white);
      doc.roundedRect(x, cardY, cardW, cardH, 3, 3, 'F');
      // Top accent
      doc.setFillColor(...k.color);
      doc.roundedRect(x, cardY, cardW, 3, 3, 3, 'F');
      // Border
      doc.setDrawColor(...border);
      doc.setLineWidth(0.3);
      doc.roundedRect(x, cardY, cardW, cardH, 3, 3, 'S');
      // Label
      doc.setTextColor(...light);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(k.label, x + 4, cardY + 11);
      // Value
      doc.setTextColor(...k.color);
      doc.setFontSize(15);
      doc.setFont('helvetica', 'bold');
      doc.text(k.value, x + 4, cardY + 23);
      // Unit
      doc.setTextColor(...mid);
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      doc.text(k.unit, x + 4, cardY + 30);
    });

    // ── Two-column analytics & performance ─────────────────────────
    const secY = cardY + cardH + 12;

    // LEFT: Performance Analytics
    doc.setTextColor(...dark);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('PERFORMANCE ANALYTICS', 14, secY);
    doc.setFillColor(...navy);
    doc.rect(14, secY + 2, 88, 1, 'F');

    autoTable(doc, {
      startY: secY + 6,
      head: [['Metric', 'Value', 'Rating']],
      body: [
        ['Avg Energy/Record',   `${avgEnergy.toFixed(1)} kWh`,      'Per Entry'],
        ['Avg Efficiency',      `${avgEfficiency.toFixed(1)}%`,     avgEfficiency >= 80 ? 'Excellent' : avgEfficiency >= 60 ? 'Good' : 'Average'],
        ['Maintenance Rate',    `${((recordsWithMaintenance/totalRecords)*100).toFixed(1)}%`, `${recordsWithMaintenance} of ${totalRecords}`],
        ['Active Sources',      `${activeSources}`,                 'Sources Used']
      ],
      theme: 'plain',
      headStyles: { fillColor: navy, textColor: white, fontStyle: 'bold', fontSize: 9, cellPadding: { top: 4, bottom: 4, left: 4, right: 4 } },
      bodyStyles: { fontSize: 8.5, cellPadding: { top: 3.5, bottom: 3.5, left: 4, right: 4 }, textColor: dark },
      alternateRowStyles: { fillColor: lightBg },
      columnStyles: {
        0: { cellWidth: 40, fontStyle: 'bold' },
        1: { cellWidth: 26, halign: 'right', textColor: green, fontStyle: 'bold' },
        2: { cellWidth: 22, halign: 'center', textColor: mid }
      },
      margin: { left: 14, right: 108 },
      styles: { lineColor: border, lineWidth: 0.2 }
    });

    // RIGHT: Source Distribution (if sources available)
    const rightX = 108;
    doc.setTextColor(...dark);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('SOURCE BREAKDOWN', rightX, secY);
    doc.setFillColor(...navy);
    doc.rect(rightX, secY + 2, 88, 1, 'F');

    // Group records by source
    const sourceMap = {};
    records.forEach(r => {
      const sourceName = r.source?.sourceName || 'Unknown';
      if (!sourceMap[sourceName]) {
        sourceMap[sourceName] = { count: 0, energy: 0 };
      }
      sourceMap[sourceName].count++;
      sourceMap[sourceName].energy += r.energyGenerated || 0;
    });

    const sourceData = Object.entries(sourceMap).slice(0, 4); // Top 4 sources
    sourceData.forEach((s, i) => {
      const y = secY + 8 + i * 22;
      const [name, data] = s;
      doc.setFillColor(...white);
      doc.roundedRect(rightX, y, 88, 18, 2, 2, 'F');
      doc.setFillColor(...green);
      doc.roundedRect(rightX, y, 3.5, 18, 1, 1, 'F');
      doc.setDrawColor(...border);
      doc.setLineWidth(0.2);
      doc.roundedRect(rightX, y, 88, 18, 2, 2, 'S');

      doc.setTextColor(...dark);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text(name.substring(0, 25), rightX + 8, y + 7);
      doc.setTextColor(...mid);
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      doc.text(`${data.count} records • ${(data.energy/1000).toFixed(2)}K kWh`, rightX + 8, y + 14);
    });

    // ── Detailed records table ───────────────────────────────────────
    const tableStartY = doc.lastAutoTable.finalY + 16;

    doc.setTextColor(...dark);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('DETAILED ENERGY RECORDS', 14, tableStartY);
    doc.setFillColor(...navy);
    doc.rect(14, tableStartY + 2, pageW - 28, 1, 'F');

    const sortedRecords = [...records].sort((a, b) => new Date(a.recordDate) - new Date(b.recordDate));

    autoTable(doc, {
      startY: tableStartY + 7,
      head: [['#', 'Source', 'Date', 'Energy (kWh)', 'Efficiency', 'Savings (LKR)', 'Weather']],
      body: sortedRecords.map((record, idx) => [
        idx + 1,
        (record.source?.sourceName || 'N/A').substring(0, 15),
        new Date(record.recordDate).toLocaleDateString('en-US', { year: '2-digit', month: 'short', day: '2-digit' }),
        record.energyGenerated.toFixed(1),
        record.efficiency ? `${record.efficiency.toFixed(1)}%` : 'N/A',
        record.costSavings ? record.costSavings.toLocaleString() : '0',
        record.weatherCondition || 'N/A'
      ]),
      theme: 'plain',
      headStyles: { fillColor: navy, textColor: white, fontStyle: 'bold', fontSize: 9, cellPadding: { top: 5, bottom: 5, left: 4, right: 4 } },
      bodyStyles: { fontSize: 8.5, cellPadding: { top: 4, bottom: 4, left: 4, right: 4 }, textColor: dark },
      alternateRowStyles: { fillColor: lightBg },
      columnStyles: {
        0: { cellWidth: 9,  halign: 'center', textColor: light },
        1: { cellWidth: 32, fontStyle: 'bold', textColor: green },
        2: { cellWidth: 24, halign: 'center' },
        3: { cellWidth: 24, halign: 'right', fontStyle: 'bold', textColor: emerald },
        4: { cellWidth: 22, halign: 'center' },
        5: { cellWidth: 26, halign: 'right' },
        6: { cellWidth: 20, halign: 'center', fontSize: 7.5 }
      },
      margin: { left: 14, right: 14 },
      styles: { lineColor: border, lineWidth: 0.2 },
      showHead: 'everyPage'
    });

    // ── Footer on every page ───────────────────────────────────────
    const totalPages = doc.internal.getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p);
      doc.setFillColor(...navy);
      doc.rect(0, pageH - 14, pageW, 14, 'F');
      doc.setFillColor(...emerald);
      doc.rect(0, pageH - 14, pageW, 2, 'F');

      doc.setTextColor(...white);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text('POWERSENSE - Renewable Energy', 14, pageH - 6);
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
    const filename = `PowerSense_Renewable_Energy_${new Date().toISOString().slice(0, 10)}.pdf`;
    doc.save(filename);
  };

  const formatNumber = (num) => {
    if (!num) return '0';
    return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(num);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="loading-spinner w-12 h-12"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4">
        <div className="flex items-center">
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
          <span>{error}</span>
        </div>
        <button 
          onClick={fetchRecords}
          className="ml-4 text-red-600 hover:text-red-800 underline font-medium"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-textPrimary dark:text-gray-100">Renewable Energy Records</h1>
          <p className="text-textSecondary dark:text-gray-300 mt-1">Track your renewable energy production</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <Link
            to="/renewable/analytics"
            className="btn-primary flex items-center bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600"
          >
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
            </svg>
            Advanced Analytics
          </Link>
          <button
            onClick={generateRecordsSummaryPDF}
            className="btn-accent flex items-center"
            title="Download Energy Summary PDF"
          >
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM8 17v-1h8v1H8zm0-3v-1h8v1H8zm0-3V10h4v1H8z"/>
            </svg>
            Energy Summary
          </button>
          <Link
            to="/renewable/sources"
            className="btn-secondary flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M13 3h-2v10h2V3zm4.83 2.17l-1.42 1.42C17.99 7.86 19 9.81 19 12c0 3.87-3.13 7-7 7s-7-3.13-7-7c0-2.19 1.01-4.14 2.58-5.42L6.17 5.17C4.23 6.82 3 9.26 3 12c0 4.97 4.03 9 9 9s9-4.03 9-9c0-2.74-1.23-5.18-3.17-6.83z"/>
            </svg>
            Manage Sources
          </Link>
          <button
            onClick={handleAddNew}
            className="btn-primary flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
            </svg>
            Add New Record
          </button>
        </div>
      </div>

      {records.length === 0 ? (
        <div className="text-center py-12">
          <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-8 max-w-md mx-auto">
            <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-gray-600 dark:text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M13 3h-2v10h2V3zm4.83 2.17l-1.42 1.42C17.99 7.86 19 9.81 19 12c0 3.87-3.13 7-7 7s-7-3.13-7-7c0-2.19 1.01-4.14 2.58-5.42L6.17 5.17C4.23 6.82 3 9.26 3 12c0 4.97 4.03 9 9 9s9-4.03 9-9c0-2.74-1.23-5.18-3.17-6.83z"/>
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">No energy records found</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Start by creating your first energy record</p>
            <button
              onClick={handleAddNew}
              className="btn-primary inline-flex items-center"
            >
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
              </svg>
              Create Your First Record
            </button>
          </div>
        </div>
      ) : (
        <div className="card overflow-hidden">
          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="table">
              <thead className="table-header">
                <tr>
                  <th>Source</th>
                  <th>Date</th>
                  <th>Energy Generated</th>
                  <th>Efficiency</th>
                  <th>Cost Savings</th>
                  <th>Weather</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => (
                  <tr key={record._id} className="table-row">
                    <td className="table-cell font-medium text-textPrimary dark:text-gray-100">
                      {record.source?.sourceName || 'N/A'}
                      <span className="block text-xs text-textSecondary dark:text-gray-400">
                        {record.source?.sourceType}
                      </span>
                    </td>
                    <td className="table-cell">
                      {formatDate(record.recordDate)}
                    </td>
                    <td className="table-cell">
                      <span className="font-semibold text-textPrimary dark:text-gray-200">{formatNumber(record.energyGenerated)}</span> 
                      <span className="text-textSecondary dark:text-gray-400"> {record.energyUnit || 'kWh'}</span>
                    </td>
                    <td className="table-cell font-semibold text-textPrimary dark:text-gray-200">
                      {record.efficiency ? `${formatNumber(record.efficiency)}%` : 'N/A'}
                    </td>
                    <td className="table-cell">
                      <span className="font-semibold text-green-600 dark:text-green-400">
                        {record.costSavings ? `Rs. ${formatNumber(record.costSavings)}` : 'N/A'}
                      </span>
                    </td>
                    <td className="table-cell">
                      <span className="badge badge-secondary">
                        {record.weatherCondition || 'N/A'}
                      </span>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEditRecord(record)}
                          className="btn-ghost btn-sm text-secondary hover:text-primary dark:text-secondary dark:hover:text-primary-light"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(record)}
                          className="btn-ghost btn-sm text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="lg:hidden space-y-4 p-4">
            {records.map((record) => (
              <div key={record._id} className="card-hover p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-textPrimary dark:text-gray-100">
                      {record.source?.sourceName || 'N/A'}
                    </h3>
                    <p className="text-sm text-textSecondary dark:text-gray-400">{formatDate(record.recordDate)}</p>
                  </div>
                  <span className="badge badge-secondary">
                    {record.weatherCondition || 'N/A'}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                  <div>
                    <span className="text-textSecondary dark:text-gray-400">Energy</span>
                    <p className="font-semibold text-textPrimary dark:text-gray-200">
                      {formatNumber(record.energyGenerated)} {record.energyUnit || 'kWh'}
                    </p>
                  </div>
                  <div>
                    <span className="text-textSecondary dark:text-gray-400">Efficiency</span>
                    <p className="font-semibold text-textPrimary dark:text-gray-200">
                      {record.efficiency ? `${formatNumber(record.efficiency)}%` : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <span className="text-textSecondary dark:text-gray-400">Cost Savings</span>
                    <p className="font-semibold text-green-600 dark:text-green-400">
                      {record.costSavings ? `Rs. ${formatNumber(record.costSavings)}` : 'N/A'}
                    </p>
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => handleEditRecord(record)}
                    className="btn-secondary btn-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(record)}
                    className="btn-danger btn-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && deletingRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Delete Energy Record?
            </h3>
            <div className="bg-gray-50 dark:bg-gray-700 rounded p-3 mb-4">
              <p className="font-medium text-gray-900 dark:text-white">
                {deletingRecord.source?.sourceName || 'N/A'}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {formatDate(deletingRecord.recordDate)} - {formatNumber(deletingRecord.energyGenerated)} kWh
              </p>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Are you sure you want to delete this record? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={cancelDelete}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Generation Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full">
            <div className="p-6">
              {/* Header */}
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <svg className="w-7 h-7 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                    </svg>
                    Download Energy Records Report
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Export your renewable energy production data
                  </p>
                </div>
                <button
                  onClick={() => setShowReportModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
                  </svg>
                  <div>
                    <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">Report Includes:</h4>
                    <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                      <li>• Energy generation data with dates and amounts</li>
                      <li>• Efficiency metrics and performance indicators</li>
                      <li>• Weather conditions and cost savings</li>
                      <li>• Source details and maintenance records</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Date Filter Section */}
              <div className="mb-6 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-5">
                <div className="flex items-center gap-2 mb-4">
                  <svg className="w-5 h-5 text-gray-700 dark:text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm2-7h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z"/>
                  </svg>
                  <h4 className="font-semibold text-gray-900 dark:text-white">Filter by Date Range</h4>
                  <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded">Optional</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={reportFilter.startDate}
                      onChange={(e) => setReportFilter({ ...reportFilter, startDate: e.target.value })}
                      className="w-full px-4 py-2.5 border-2 border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={reportFilter.endDate}
                      onChange={(e) => setReportFilter({ ...reportFilter, endDate: e.target.value })}
                      className="w-full px-4 py-2.5 border-2 border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                    />
                  </div>
                </div>
                {(reportFilter.startDate || reportFilter.endDate) && (
                  <p className="text-xs text-green-600 dark:text-green-400 mt-3 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                    </svg>
                    Date filter applied
                  </p>
                )}
              </div>

              {/* Download Options */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-gray-700 dark:text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 12v7H5v-7H3v7c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-7h-2zm-6 .67l2.59-2.58L17 11.5l-5 5-5-5 1.41-1.41L11 12.67V3h2z"/>
                  </svg>
                  Choose Download Format
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* PDF Option */}
                  <button
                    onClick={() => handleGenerateReport('records', 'pdf')}
                    disabled={reportLoading}
                    className="group relative overflow-hidden bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl p-6 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8.5 7.5c0 .83-.67 1.5-1.5 1.5H9v2H7.5V7H10c.83 0 1.5.67 1.5 1.5v1zm5 2c0 .83-.67 1.5-1.5 1.5h-2.5V7H15c.83 0 1.5.67 1.5 1.5v3zm4-3H19v1h1.5V11H19v2h-1.5V7h3v1.5zM9 9.5h1v-1H9v1zM4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm10 5.5h1v-3h-1v3z"/>
                        </svg>
                      </div>
                      <div className="text-left flex-1">
                        <h5 className="font-bold text-lg mb-1">PDF Report</h5>
                        <p className="text-sm text-red-100">Professional formatted document</p>
                      </div>
                      <svg className="w-6 h-6 transform group-hover:translate-x-1 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/>
                      </svg>
                    </div>
                  </button>

                  {/* CSV Option */}
                  <button
                    onClick={() => handleGenerateReport('records', 'csv')}
                    disabled={reportLoading}
                    className="group relative overflow-hidden bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl p-6 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
                        </svg>
                      </div>
                      <div className="text-left flex-1">
                        <h5 className="font-bold text-lg mb-1">CSV Export</h5>
                        <p className="text-sm text-green-100">Spreadsheet-compatible data</p>
                      </div>
                      <svg className="w-6 h-6 transform group-hover:translate-x-1 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/>
                      </svg>
                    </div>
                  </button>
                </div>
              </div>

              {/* Loading State */}
              {reportLoading && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 border-4 border-green-200 border-t-green-600 rounded-full animate-spin"></div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">Generating your report...</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">This will download automatically when ready</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => {
                    setShowReportModal(false);
                    setReportFilter({ startDate: '', endDate: '', sourceId: '' });
                  }}
                  className="px-6 py-2.5 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Energy Record Form Modal */}
      {showFormModal && (
        <Modal
          isOpen={showFormModal}
          onClose={() => {
            setShowFormModal(false);
            setEditingRecord(null);
            setFormData(initialFormState);
            setFormError(null);
            setFormSuccess(null);
          }}
          title={editingRecord ? 'Edit Energy Record' : 'Add New Energy Record'}
          size="large"
        >
          <form onSubmit={handleFormSubmit} className="space-y-6">
            {/* Success/Error Messages */}
            {formSuccess && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded dark:bg-green-900/20 dark:border-green-800 dark:text-green-400">
                <p className="text-sm font-medium">{formSuccess}</p>
              </div>
            )}

            {formError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
                <p className="text-sm font-medium">{formError}</p>
              </div>
            )}

            {/* Basic Information */}
            <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Renewable Source <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="source"
                    value={formData.source}
                    onChange={handleFormInputChange}
                    required
                    className={`w-full border ${formErrors.source ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-lg px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-transparent`}
                  >
                    <option value="">Select a source...</option>
                    {sources.map(source => (
                      <option key={source._id} value={source._id}>
                        {getSourceTypeIcon(source.sourceType)} {source.sourceName} ({source.capacity} {source.capacityUnit})
                      </option>
                    ))}
                  </select>
                  {formErrors.source && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.source}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Record Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="recordDate"
                    value={formData.recordDate}
                    onChange={handleFormInputChange}
                    required
                    max={new Date().toISOString().split('T')[0]}
                    className={`w-full border ${formErrors.recordDate ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-lg px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-transparent`}
                  />
                  {formErrors.recordDate && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.recordDate}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Energy Production */}
            <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Energy Production</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Energy Generated <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <input
                        type="number"
                        name="energyGenerated"
                        value={formData.energyGenerated}
                        onChange={handleFormInputChange}
                        required
                        min="0.01"
                        max="1000000"
                        step="0.01"
                        className={`w-full border ${formErrors.energyGenerated ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-lg px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-transparent`}
                        placeholder="e.g., 45.5"
                      />
                      {formErrors.energyGenerated && (
                        <p className="text-red-500 text-xs mt-1">{formErrors.energyGenerated}</p>
                      )}
                    </div>
                    <select
                      name="energyUnit"
                      value={formData.energyUnit}
                      onChange={handleFormInputChange}
                      className="border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="kWh">kWh</option>
                      <option value="MWh">MWh</option>
                      <option value="GWh">GWh</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Peak Power (kW)</label>
                  <input
                    type="number"
                    name="peakPower"
                    value={formData.peakPower}
                    onChange={handleFormInputChange}
                    min="0"
                    max="1000000"
                    step="0.01"
                    className={`w-full border ${formErrors.peakPower ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-lg px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-transparent`}
                    placeholder="e.g., 5.2"
                  />
                  {formErrors.peakPower && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.peakPower}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Average Power (kW)</label>
                  <input
                    type="number"
                    name="averagePower"
                    value={formData.averagePower}
                    onChange={handleFormInputChange}
                    min="0"
                    step="0.01"
                    className={`w-full border ${formErrors.averagePower ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-lg px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-transparent`}
                    placeholder="e.g., 3.8"
                  />
                  {formErrors.averagePower && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.averagePower}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Performance Metrics</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Operating Hours</label>
                  <input
                    type="number"
                    name="operatingHours"
                    value={formData.operatingHours}
                    onChange={handleFormInputChange}
                    min="0"
                    max="24"
                    step="0.1"
                    className={`w-full border ${formErrors.operatingHours ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-lg px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-transparent`}
                    placeholder="0-24 hours"
                  />
                  {formErrors.operatingHours && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.operatingHours}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Efficiency (%)</label>
                  <input
                    type="number"
                    name="efficiency"
                    value={formData.efficiency}
                    onChange={handleFormInputChange}
                    min="0"
                    max="100"
                    step="0.01"
                    className={`w-full border ${formErrors.efficiency ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-lg px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-transparent`}
                    placeholder="0-100%"
                  />
                  {formErrors.efficiency && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.efficiency}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cost Savings (LKR)</label>
                  <input
                    type="number"
                    name="costSavings"
                    value={formData.costSavings}
                    onChange={handleFormInputChange}
                    min="0"
                    max="10000000"
                    step="0.01"
                    className={`w-full border ${formErrors.costSavings ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-lg px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-transparent`}
                    placeholder="e.g., 1250"
                  />
                  {formErrors.costSavings && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.costSavings}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Environmental Conditions */}
            <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Environmental Conditions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Weather Condition</label>
                  <select
                    name="weatherCondition"
                    value={formData.weatherCondition}
                    onChange={handleFormInputChange}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    {weatherOptions.map(weather => (
                      <option key={weather} value={weather}>
                        {getWeatherIcon(weather)} {weather}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Temperature (°C)</label>
                  <input
                    type="number"
                    name="temperature"
                    value={formData.temperature}
                    onChange={handleFormInputChange}
                    min="-100"
                    max="150"
                    step="0.1"
                    className={`w-full border ${formErrors.temperature ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-lg px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-transparent`}
                    placeholder="e.g., 28.5"
                  />
                  {formErrors.temperature && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.temperature}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Maintenance & Notes */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Maintenance & Notes</h3>
              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="maintenancePerformed"
                    checked={formData.maintenancePerformed}
                    onChange={handleFormInputChange}
                    className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
                  />
                  <label className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Maintenance performed on this day
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Issues or Problems</label>
                  <textarea
                    name="issues"
                    value={formData.issues}
                    onChange={handleFormInputChange}
                    rows="2"
                    maxLength="500"
                    className={`w-full border ${formErrors.issues ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-lg px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-transparent`}
                    placeholder="Report any issues or problems encountered..."
                  />
                  {formErrors.issues && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.issues}</p>
                  )}
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{formData.issues.length}/500 characters</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Additional Notes</label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleFormInputChange}
                    rows="3"
                    maxLength="500"
                    className={`w-full border ${formErrors.notes ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-lg px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-transparent`}
                    placeholder="Any additional observations or comments..."
                  />
                  {formErrors.notes && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.notes}</p>
                  )}
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{formData.notes.length}/500 characters</p>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                type="submit"
                className="flex-1 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-colors font-medium"
              >
                {editingRecord ? 'Update Record' : 'Create Record'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowFormModal(false);
                  setEditingRecord(null);
                  setFormData(initialFormState);
                  setFormError(null);
                  setFormSuccess(null);
                }}
                className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium text-gray-700 dark:text-gray-300"
              >
                Cancel
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default RenewableDashboard;
