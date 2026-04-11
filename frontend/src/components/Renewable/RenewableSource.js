import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { renewableService } from '../../services/api';
import Modal from '../common/Modal';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const RenewableSource = () => {
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingSource, setEditingSource] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingSource, setDeletingSource] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  const sourceTypes = ['Solar', 'Wind', 'Hydro', 'Biomass', 'Geothermal', 'Other'];
  const statusOptions = ['Active', 'Inactive', 'Maintenance'];

  const initialFormState = {
    sourceName: '',
    sourceType: 'Solar',
    capacity: '',
    capacityUnit: 'kW',
    installationDate: '',
    location: '',
    status: 'Active',
    description: '',
    estimatedAnnualProduction: '',
    manufacturer: '',
    warrantyExpiry: ''
  };

  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    fetchSources();
  }, []);

  const fetchSources = async () => {
    try {
      setLoading(true);
      const response = await renewableService.getSources();
      setSources(response.data.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch renewable sources');
      console.error('Error fetching sources:', err);
    } finally {
      setLoading(false);
    }
  };

  const validateField = (name, value) => {
    const errors = {};

    switch (name) {
      case 'sourceName':
        if (!value.trim()) {
          errors.sourceName = 'Source name is required';
        } else if (value.trim().length < 3) {
          errors.sourceName = 'Source name must be at least 3 characters';
        } else if (value.trim().length > 100) {
          errors.sourceName = 'Source name must not exceed 100 characters';
        }
        break;

      case 'capacity':
        if (!value) {
          errors.capacity = 'Capacity is required';
        } else if (parseFloat(value) <= 0) {
          errors.capacity = 'Capacity must be greater than 0';
        } else if (parseFloat(value) > 1000000) {
          errors.capacity = 'Capacity value is too large';
        }
        break;

      case 'installationDate':
        if (!value) {
          errors.installationDate = 'Installation date is required';
        } else if (new Date(value) > new Date()) {
          errors.installationDate = 'Installation date cannot be in the future';
        }
        break;

      case 'location':
        if (value && value.length > 200) {
          errors.location = 'Location must not exceed 200 characters';
        }
        break;

      case 'description':
        if (value && value.length > 500) {
          errors.description = 'Description must not exceed 500 characters';
        }
        break;

      case 'estimatedAnnualProduction':
        if (value && parseFloat(value) < 0) {
          errors.estimatedAnnualProduction = 'Production cannot be negative';
        } else if (value && parseFloat(value) > 1000000000) {
          errors.estimatedAnnualProduction = 'Production value is too large';
        }
        break;

      case 'manufacturer':
        if (value && value.length > 100) {
          errors.manufacturer = 'Manufacturer name must not exceed 100 characters';
        }
        break;

      case 'warrantyExpiry':
        if (value && formData.installationDate && new Date(value) < new Date(formData.installationDate)) {
          errors.warrantyExpiry = 'Warranty expiry must be after installation date';
        }
        break;

      default:
        break;
    }

    return errors;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
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
    const fieldErrors = validateField(name, value);
    if (Object.keys(fieldErrors).length > 0) {
      setFormErrors(prev => ({ ...prev, ...fieldErrors }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate all fields
    const errors = {};
    Object.keys(formData).forEach(key => {
      const fieldErrors = validateField(key, formData[key]);
      Object.assign(errors, fieldErrors);
    });

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setError('Please fix the errors in the form');
      return;
    }

    try {
      if (editingSource) {
        await renewableService.updateSource(editingSource._id, formData);
      } else {
        await renewableService.createSource(formData);
      }
      
      setShowModal(false);
      setEditingSource(null);
      setFormData(initialFormState);
      setFormErrors({});
      setError(null);
      fetchSources();
    } catch (err) {
      setError(err.response?.data?.message || (editingSource ? 'Failed to update source' : 'Failed to create source'));
      console.error('Error saving source:', err);
    }
  };

  const handleEdit = (source) => {
    setEditingSource(source);
    setFormData({
      sourceName: source.sourceName,
      sourceType: source.sourceType,
      capacity: source.capacity,
      capacityUnit: source.capacityUnit,
      installationDate: source.installationDate ? source.installationDate.split('T')[0] : '',
      location: source.location || '',
      status: source.status,
      description: source.description || '',
      estimatedAnnualProduction: source.estimatedAnnualProduction || '',
      manufacturer: source.manufacturer || '',
      warrantyExpiry: source.warrantyExpiry ? source.warrantyExpiry.split('T')[0] : ''
    });
    setFormErrors({});
    setError(null);
    setShowModal(true);
  };

  const handleDelete = (source) => {
    setDeletingSource(source);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!deletingSource) return;
    
    try {
      await renewableService.deleteSource(deletingSource._id);
      setSources(sources.filter(source => source._id !== deletingSource._id));
      setShowDeleteModal(false);
      setDeletingSource(null);
    } catch (err) {
      setError('Failed to delete source');
      console.error('Error deleting source:', err);
      setShowDeleteModal(false);
      setDeletingSource(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setDeletingSource(null);
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

  const handleGenerateReport = async (format) => {
    setReportLoading(true);
    try {
      let response;
      if (format === 'pdf') {
        response = await renewableService.generateSourcesPDF();
        downloadFile(response.data, `renewable-sources-report-${Date.now()}.pdf`);
      } else {
        response = await renewableService.generateSourcesCSV();
        downloadFile(response.data, `renewable-sources-${Date.now()}.csv`);
      }
      setShowReportModal(false);
    } catch (err) {
      console.error('Error generating report:', err);
      setError('Failed to generate report. Please try again.');
    } finally {
      setReportLoading(false);
    }
  };

  const handleAddNew = () => {
    setEditingSource(null);
    setFormData(initialFormState);
    setFormErrors({});
    setError(null);
    setShowModal(true);
  };

  const generateSourcesSummaryPDF = () => {
    if (sources.length === 0) {
      alert('No renewable energy sources available to generate a summary.');
      return;
    }

    const doc = new jsPDF();
    const pageW = doc.internal.pageSize.width;
    const pageH = doc.internal.pageSize.height;

    // ── Color palette ──────────────────────────────────────────────
    const navy    = [25, 50, 85];
    const green   = [34, 139, 34];
    const emerald = [16, 185, 129];
    const amber   = [245, 158, 11];
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
    doc.text('RENEWABLE SOURCES REPORT', pageW - 14, 18, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    doc.text(`Generated: ${today}`, pageW - 14, 28, { align: 'right' });

    // ── Compute statistics ─────────────────────────────────────────
    const totalSources = sources.length;
    const activeSources = sources.filter(s => s.status === 'Active').length;
    const maintenanceSources = sources.filter(s => s.status === 'Maintenance').length;
    const inactiveSources = sources.filter(s => s.status === 'Inactive').length;
    const totalCapacity = sources.reduce((s, src) => s + (src.capacity || 0), 0);
    const totalEstProduction = sources.reduce((s, src) => s + (src.estimatedAnnualProduction || 0), 0);

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
      { label: 'Total Sources',    value: totalSources.toString(),                   unit: 'Installations', color: navy  },
      { label: 'Active Sources',   value: activeSources.toString(),                  unit: 'Operational',   color: green },
      { label: 'Total Capacity',   value: `${(totalCapacity / 1000).toFixed(2)}K`,   unit: 'kW',            color: emerald },
      { label: 'Est. Production',  value: `${(totalEstProduction / 1000).toFixed(1)}K`, unit: 'kWh/Year',   color: blue }
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

    // ── Two-column analytics ───────────────────────────────────────
    const secY = cardY + cardH + 12;

    // LEFT: Source Type Distribution
    doc.setTextColor(...dark);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('SOURCE TYPE DISTRIBUTION', 14, secY);
    doc.setFillColor(...navy);
    doc.rect(14, secY + 2, 88, 1, 'F');

    // Group by type
    const typeMap = {};
    sources.forEach(s => {
      const type = s.sourceType || 'Other';
      if (!typeMap[type]) {
        typeMap[type] = { count: 0, capacity: 0 };
      }
      typeMap[type].count++;
      typeMap[type].capacity += s.capacity || 0;
    });

    autoTable(doc, {
      startY: secY + 6,
      head: [['Type', 'Count', 'Capacity (kW)']],
      body: Object.entries(typeMap).map(([type, data]) => [
        type,
        data.count.toString(),
        data.capacity.toFixed(1)
      ]),
      theme: 'plain',
      headStyles: { fillColor: navy, textColor: white, fontStyle: 'bold', fontSize: 9, cellPadding: { top: 4, bottom: 4, left: 4, right: 4 } },
      bodyStyles: { fontSize: 8.5, cellPadding: { top: 3.5, bottom: 3.5, left: 4, right: 4 }, textColor: dark },
      alternateRowStyles: { fillColor: lightBg },
      columnStyles: {
        0: { cellWidth: 40, fontStyle: 'bold' },
        1: { cellWidth: 24, halign: 'center', textColor: green, fontStyle: 'bold' },
        2: { cellWidth: 24, halign: 'right', textColor: emerald, fontStyle: 'bold' }
      },
      margin: { left: 14, right: 108 },
      styles: { lineColor: border, lineWidth: 0.2 }
    });

    // RIGHT: Status Breakdown
    const rightX = 108;
    doc.setTextColor(...dark);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('STATUS BREAKDOWN', rightX, secY);
    doc.setFillColor(...navy);
    doc.rect(rightX, secY + 2, 88, 1, 'F');

    const statusData = [
      { label: 'Active', count: activeSources, pct: ((activeSources/totalSources)*100).toFixed(0), color: green },
      { label: 'Maintenance', count: maintenanceSources, pct: ((maintenanceSources/totalSources)*100).toFixed(0), color: amber },
      { label: 'Inactive', count: inactiveSources, pct: ((inactiveSources/totalSources)*100).toFixed(0), color: mid }
    ];

    statusData.forEach((s, i) => {
      const y = secY + 8 + i * 20;
      doc.setFillColor(...white);
      doc.roundedRect(rightX, y, 88, 16, 2, 2, 'F');
      doc.setFillColor(...s.color);
      doc.roundedRect(rightX, y, 3.5, 16, 1, 1, 'F');
      doc.setDrawColor(...border);
      doc.setLineWidth(0.2);
      doc.roundedRect(rightX, y, 88, 16, 2, 2, 'S');

      doc.setTextColor(...dark);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text(s.label, rightX + 8, y + 7);
      doc.setTextColor(...s.color);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(`${s.count} (${s.pct}%)`, rightX + 8, y + 13);
    });

    // ── Detailed sources table ────────────────────────────────────
    const tableStartY = doc.lastAutoTable.finalY + 16;

    doc.setTextColor(...dark);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('DETAILED SOURCE RECORDS', 14, tableStartY);
    doc.setFillColor(...navy);
    doc.rect(14, tableStartY + 2, pageW - 28, 1, 'F');

    const sortedSources = [...sources].sort((a, b) => new Date(a.installationDate) - new Date(b.installationDate));

    autoTable(doc, {
      startY: tableStartY + 7,
      head: [['#', 'Source Name', 'Type', 'Capacity', 'Location', 'Installed', 'Status']],
      body: sortedSources.map((source, idx) => [
        idx + 1,
        (source.sourceName || 'N/A').substring(0, 20),
        source.sourceType || 'N/A',
        `${source.capacity || 0} ${source.capacityUnit || 'kW'}`,
        (source.location || 'N/A').substring(0, 15),
        new Date(source.installationDate).toLocaleDateString('en-US', { year: '2-digit', month: 'short', day: '2-digit' }),
        source.status || 'N/A'
      ]),
      theme: 'plain',
      headStyles: { fillColor: navy, textColor: white, fontStyle: 'bold', fontSize: 9, cellPadding: { top: 5, bottom: 5, left: 4, right: 4 } },
      bodyStyles: { fontSize: 8.5, cellPadding: { top: 4, bottom: 4, left: 4, right: 4 }, textColor: dark },
      alternateRowStyles: { fillColor: lightBg },
      columnStyles: {
        0: { cellWidth: 9,  halign: 'center', textColor: light },
        1: { cellWidth: 38, fontStyle: 'bold', textColor: green },
        2: { cellWidth: 20, halign: 'center' },
        3: { cellWidth: 24, halign: 'right', fontStyle: 'bold', textColor: emerald },
        4: { cellWidth: 28, halign: 'left' },
        5: { cellWidth: 24, halign: 'center' },
        6: { cellWidth: 22, halign: 'center', fontStyle: 'bold' }
      },
      margin: { left: 14, right: 14 },
      styles: { lineColor: border, lineWidth: 0.2 },
      showHead: 'everyPage',
      didParseCell: (data) => {
        if (data.section === 'body') {
          const source = sortedSources[data.row.index];
          if (!source) return;
          // Status column
          if (data.column.index === 6) {
            if (source.status === 'Active') {
              data.cell.styles.textColor = green;
              data.cell.styles.fillColor = [240, 255, 240];
            } else if (source.status === 'Maintenance') {
              data.cell.styles.textColor = amber;
              data.cell.styles.fillColor = [255, 250, 235];
            } else {
              data.cell.styles.textColor = mid;
            }
          }
        }
      }
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
      doc.text('POWERSENSE - Renewable Sources', 14, pageH - 6);
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
    const filename = `PowerSense_Renewable_Sources_${new Date().toISOString().slice(0, 10)}.pdf`;
    doc.save(filename);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
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
          onClick={fetchSources}
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
          <h1 className="text-3xl font-bold text-textPrimary dark:text-gray-100">Renewable Energy Sources</h1>
          <p className="text-textSecondary dark:text-gray-300 mt-1">Manage your renewable energy installations</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={generateSourcesSummaryPDF}
            className="btn-accent flex items-center"
            title="Download Sources Summary PDF"
          >
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM8 17v-1h8v1H8zm0-3v-1h8v1H8zm0-3V10h4v1H8z"/>
            </svg>
            Energy Summary
          </button>
          <button
            onClick={handleAddNew}
            className="btn-primary flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
            </svg>
            Add New Source
          </button>
        </div>
      </div>

      {sources.length === 0 ? (
        <div className="text-center py-12">
          <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-8 max-w-md mx-auto">
            <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-gray-600 dark:text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M13 3h-2v10h2V3zm4.83 2.17l-1.42 1.42C17.99 7.86 19 9.81 19 12c0 3.87-3.13 7-7 7s-7-3.13-7-7c0-2.19 1.01-4.14 2.58-5.42L6.17 5.17C4.23 6.82 3 9.26 3 12c0 4.97 4.03 9 9 9s9-4.03 9-9c0-2.74-1.23-5.18-3.17-6.83z"/>
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">No sources found</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Start by creating your first renewable energy source</p>
            <button
              onClick={handleAddNew}
              className="btn-primary inline-flex items-center"
            >
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
              </svg>
              Create Your First Source
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
                  <th>Source Name</th>
                  <th>Type</th>
                  <th>Capacity</th>
                  <th>Location</th>
                  <th>Installation Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sources.map((source) => (
                  <tr key={source._id} className="table-row">
                    <td className="table-cell font-medium text-textPrimary dark:text-gray-100">
                      {source.sourceName}
                    </td>
                    <td className="table-cell">
                      <span className="badge badge-secondary">
                        {source.sourceType}
                      </span>
                    </td>
                    <td className="table-cell">
                      <span className="font-semibold text-textPrimary dark:text-gray-200">{source.capacity}</span> 
                      <span className="text-textSecondary dark:text-gray-400"> {source.capacityUnit}</span>
                    </td>
                    <td className="table-cell text-textSecondary dark:text-gray-400">
                      {source.location || 'N/A'}
                    </td>
                    <td className="table-cell">
                      {formatDate(source.installationDate)}
                    </td>
                    <td className="table-cell">
                      <span className={`badge ${
                        source.status === 'Active' ? 'badge-success' : 
                        source.status === 'Maintenance' ? 'badge-warning' : 
                        'badge-secondary'
                      }`}>
                        {source.status}
                      </span>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center space-x-2">
                        <Link
                          to={`/renewable/records?source=${source._id}`}
                          className="btn-ghost btn-sm text-primary hover:text-primary-dark dark:text-primary dark:hover:text-primary-light"
                          title="View Records"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M9 2v2h6V2h2v2h1c1.1 0 2 .9 2 2v14c0 1.1-.9 2-2 2H6c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2h1V2h2zm-2 6v10h10V8H7z"/>
                          </svg>
                        </Link>
                        <button
                          onClick={() => handleEdit(source)}
                          className="btn-ghost btn-sm text-secondary hover:text-primary dark:text-secondary dark:hover:text-primary-light"
                          title="Edit"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(source)}
                          className="btn-ghost btn-sm text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                          title="Delete"
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
            {sources.map((source) => (
              <div key={source._id} className="card-hover p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-textPrimary dark:text-gray-100">{source.sourceName}</h3>
                    <p className="text-sm text-textSecondary dark:text-gray-400">{source.sourceType}</p>
                  </div>
                  <span className={`badge ${
                    source.status === 'Active' ? 'badge-success' : 
                    source.status === 'Maintenance' ? 'badge-warning' : 
                    'badge-secondary'
                  }`}>
                    {source.status}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                  <div>
                    <span className="text-textSecondary dark:text-gray-400">Capacity</span>
                    <p className="font-semibold text-textPrimary dark:text-gray-200">
                      {source.capacity} {source.capacityUnit}
                    </p>
                  </div>
                  <div>
                    <span className="text-textSecondary dark:text-gray-400">Location</span>
                    <p className="font-semibold text-textPrimary dark:text-gray-200">{source.location || 'N/A'}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-textSecondary dark:text-gray-400">Installed</span>
                    <p className="font-semibold text-textPrimary dark:text-gray-200">{formatDate(source.installationDate)}</p>
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Link
                    to={`/renewable/records?source=${source._id}`}
                    className="btn-secondary btn-sm"
                  >
                    Records
                  </Link>
                  <button
                    onClick={() => handleEdit(source)}
                    className="btn-secondary btn-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(source)}
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

      {/* Modal */}
      {showModal && (
        <Modal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setEditingSource(null);
            setFormData(initialFormState);
          }}
          title={editingSource ? 'Edit Renewable Source' : 'Add New Renewable Source'}
          size="large"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Error Summary */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
                <p className="text-sm font-medium">{error}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Source Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="sourceName"
                  value={formData.sourceName}
                  onChange={handleInputChange}
                  required
                  minLength="3"
                  maxLength="100"
                  className={`w-full border ${formErrors.sourceName ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-lg px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-transparent`}
                  placeholder="e.g., Rooftop Solar Panel"
                />
                {formErrors.sourceName && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.sourceName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Source Type <span className="text-red-500">*</span>
                </label>
                <select
                  name="sourceType"
                  value={formData.sourceType}
                  onChange={handleInputChange}
                  required
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  {sourceTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Capacity <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <input
                      type="number"
                      name="capacity"
                      value={formData.capacity}
                      onChange={handleInputChange}
                      required
                      min="0.01"
                      max="1000000"
                      step="0.01"
                      className={`w-full border ${formErrors.capacity ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-lg px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-transparent`}
                      placeholder="e.g., 5"
                    />
                    {formErrors.capacity && (
                      <p className="text-red-500 text-xs mt-1">{formErrors.capacity}</p>
                    )}
                  </div>
                  <select
                    name="capacityUnit"
                    value={formData.capacityUnit}
                    onChange={handleInputChange}
                    className="border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="kW">kW</option>
                    <option value="MW">MW</option>
                    <option value="GW">GW</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Installation Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="installationDate"
                  value={formData.installationDate}
                  onChange={handleInputChange}
                  required
                  max={new Date().toISOString().split('T')[0]}
                  className={`w-full border ${formErrors.installationDate ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-lg px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-transparent`}
                />
                {formErrors.installationDate && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.installationDate}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Location</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  maxLength="200"
                  className={`w-full border ${formErrors.location ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-lg px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-transparent`}
                  placeholder="e.g., Rooftop Section A"
                />
                {formErrors.location && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.location}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  {statusOptions.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Estimated Annual Production (kWh)
                </label>
                <input
                  type="number"
                  name="estimatedAnnualProduction"
                  value={formData.estimatedAnnualProduction}
                  onChange={handleInputChange}
                  min="0"
                  max="1000000000"
                  step="0.01"
                  className={`w-full border ${formErrors.estimatedAnnualProduction ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-lg px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-transparent`}
                  placeholder="e.g., 7500"
                />
                {formErrors.estimatedAnnualProduction && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.estimatedAnnualProduction}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Manufacturer</label>
                <input
                  type="text"
                  name="manufacturer"
                  value={formData.manufacturer}
                  onChange={handleInputChange}
                  maxLength="100"
                  className={`w-full border ${formErrors.manufacturer ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-lg px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-transparent`}
                  placeholder="e.g., Tesla Energy"
                />
                {formErrors.manufacturer && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.manufacturer}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Warranty Expiry</label>
                <input
                  type="date"
                  name="warrantyExpiry"
                  value={formData.warrantyExpiry}
                  onChange={handleInputChange}
                  min={formData.installationDate}
                  className={`w-full border ${formErrors.warrantyExpiry ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-lg px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-transparent`}
                />
                {formErrors.warrantyExpiry && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.warrantyExpiry}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="3"
                  maxLength="500"
                  className={`w-full border ${formErrors.description ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-lg px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-transparent`}
                  placeholder="Additional details about this renewable source..."
                />
                {formErrors.description && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.description}</p>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{formData.description.length}/500 characters</p>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="submit"
                className="flex-1 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-colors font-medium"
              >
                {editingSource ? 'Update Source' : 'Create Source'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowModal(false);
                  setEditingSource(null);
                  setFormData(initialFormState);
                }}
                className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium text-gray-700 dark:text-gray-300"
              >
                Cancel
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && deletingSource && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Delete Renewable Source?
            </h3>
            <div className="bg-gray-50 dark:bg-gray-700 rounded p-3 mb-4">
              <p className="font-medium text-gray-900 dark:text-white">
                {deletingSource.sourceName}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {deletingSource.sourceType} - {deletingSource.capacity} {deletingSource.capacityUnit}
              </p>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              This will permanently delete this source and all related energy records. This action cannot be undone.
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
                    Download Sources Report
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Export your renewable energy sources data
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
                      <li>• Source names, types, and capacities</li>
                      <li>• Installation dates and locations</li>
                      <li>• Current status and maintenance info</li>
                      <li>• Estimated annual production data</li>
                    </ul>
                  </div>
                </div>
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
                    onClick={() => handleGenerateReport('pdf')}
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
                    onClick={() => handleGenerateReport('csv')}
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
                  onClick={() => setShowReportModal(false)}
                  className="px-6 py-2.5 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RenewableSource;
