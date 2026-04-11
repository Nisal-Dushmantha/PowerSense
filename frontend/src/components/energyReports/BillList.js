import React, { useState, useEffect } from 'react';
import { billService } from '../../services/api';
import CreateBillModal from './CreateBillModal';
import EditBillModal from './EditBill';
import InsightsModal from './InsightsModal';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const BillList = () => {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isInsightsModalOpen, setIsInsightsModalOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [editBillData, setEditBillData] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sendingReminder, setSendingReminder] = useState(false);

  useEffect(() => {
    fetchBills();
  }, []);

  const fetchBills = async () => {
    try {
      setLoading(true);
      const response = await billService.getAllBills();
      // Backend returns { success, message, data: { bills, pagination } }
      setBills(response.data.data.bills);
      setError(null);
    } catch (err) {
      setError('Failed to fetch bills');
      console.error('Error fetching bills:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this bill?')) {
      try {
        await billService.deleteBill(id);
        setBills(bills.filter(bill => bill._id !== id));
      } catch (err) {
        setError('Failed to delete bill');
        console.error('Error deleting bill:', err);
      }
    }
  };

  const handleBillCreated = (newBill) => {
    setBills(prevBills => [newBill, ...prevBills]);
  };

  const handleViewPhoto = (bill) => {
    if (bill.billPhoto) {
      setSelectedPhoto(bill.billPhoto);
      setIsPhotoModalOpen(true);
    }
  };

  const handleClosePhotoModal = () => {
    setIsPhotoModalOpen(false);
    setSelectedPhoto(null);
  };

  const handleEditBill = (bill) => {
    setEditBillData(bill);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditBillData(null);
  };

  const handleBillUpdated = (updatedBill) => {
    setBills(prevBills => 
      prevBills.map(bill => 
        bill._id === updatedBill._id ? updatedBill : bill
      )
    );
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const generateBillsSummaryPDF = () => {
    if (bills.length === 0) {
      alert('No bills available to generate a summary.');
      return;
    }

    const doc = new jsPDF();
    const pageW = doc.internal.pageSize.width;
    const pageH = doc.internal.pageSize.height;

    // ── Color palette ──────────────────────────────────────────────
    const navy    = [25, 50, 85];
    const blue    = [0, 120, 180];
    const green   = [40, 125, 70];
    const red     = [180, 50, 50];
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

    // Report label right-aligned
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('BILLS SUMMARY REPORT', pageW - 14, 18, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    doc.text(`Generated: ${today}`, pageW - 14, 28, { align: 'right' });

    // ── Compute statistics ─────────────────────────────────────────
    const totalBills    = bills.length;
    const paidBills     = bills.filter(b => b.isPaid).length;
    const unpaidBills   = totalBills - paidBills;
    const totalKWh      = bills.reduce((s, b) => s + (b.totalKWh || 0), 0);
    const totalAmount   = bills.reduce((s, b) => s + (b.totalPayment || 0), 0);
    const totalPaid     = bills.reduce((s, b) => s + (b.totalPaid || 0), 0);
    const totalBalance  = bills.reduce((s, b) => s + (b.balance || 0), 0);
    const avgKWh        = totalKWh / totalBills;
    const avgAmount     = totalAmount / totalBills;
    const payRate       = totalAmount > 0 ? (totalPaid / totalAmount) * 100 : 0;

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
      { label: 'Total Bills',       value: totalBills.toString(),                      unit: 'Records',                                  color: navy  },
      { label: 'Total Consumption', value: `${(totalKWh / 1000).toFixed(2)}K`,         unit: 'KWh Used',                                 color: blue  },
      { label: 'Total Amount',      value: `LKR ${(totalAmount / 1000).toFixed(1)}K`,  unit: 'Billed',                                   color: amber },
      { label: 'Outstanding',       value: `LKR ${(totalBalance / 1000).toFixed(1)}K`, unit: totalBalance > 0 ? 'Balance Due' : 'Fully Settled', color: totalBalance > 0 ? red : green }
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

    // ── Two-column analytics & status ─────────────────────────────
    const secY = cardY + cardH + 12;

    // LEFT: Analytics
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
        ['Avg Monthly Usage',   `${avgKWh.toFixed(1)} KWh`,            'Monthly Baseline'],
        ['Avg Monthly Amount',  `LKR ${(avgAmount/1000).toFixed(1)}K`, 'Avg Spend'],
        ['Payment Rate',        `${payRate.toFixed(1)}%`,               payRate >= 90 ? 'Excellent' : payRate >= 70 ? 'Good' : 'Average'],
        ['Bills Settled',       `${paidBills} / ${totalBills}`,         unpaidBills === 0 ? 'All Paid' : `${unpaidBills} Pending`]
      ],
      theme: 'plain',
      headStyles: { fillColor: navy, textColor: white, fontStyle: 'bold', fontSize: 9, cellPadding: { top: 4, bottom: 4, left: 4, right: 4 } },
      bodyStyles: { fontSize: 8.5, cellPadding: { top: 3.5, bottom: 3.5, left: 4, right: 4 }, textColor: dark },
      alternateRowStyles: { fillColor: lightBg },
      columnStyles: {
        0: { cellWidth: 40, fontStyle: 'bold' },
        1: { cellWidth: 26, halign: 'right', textColor: blue, fontStyle: 'bold' },
        2: { cellWidth: 22, halign: 'center', textColor: mid }
      },
      margin: { left: 14, right: 108 },
      styles: { lineColor: border, lineWidth: 0.2 }
    });

    // RIGHT: Financial status
    const rightX = 108;
    doc.setTextColor(...dark);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('FINANCIAL STATUS', rightX, secY);
    doc.setFillColor(...navy);
    doc.rect(rightX, secY + 2, 88, 1, 'F');

    const statusCards = [
      { label: 'Completed Bills', count: paidBills,   pct: ((paidBills / totalBills) * 100).toFixed(0),   amt: `LKR ${((totalAmount - totalBalance)/1000).toFixed(1)}K`, color: green },
      { label: 'Pending Bills',   count: unpaidBills, pct: ((unpaidBills / totalBills) * 100).toFixed(0), amt: `LKR ${(totalBalance/1000).toFixed(1)}K`,                color: amber }
    ];

    statusCards.forEach((s, i) => {
      const y = secY + 8 + i * 28;
      doc.setFillColor(...white);
      doc.roundedRect(rightX, y, 88, 24, 2, 2, 'F');
      doc.setFillColor(...s.color);
      doc.roundedRect(rightX, y, 3.5, 24, 1, 1, 'F');
      doc.setDrawColor(...border);
      doc.setLineWidth(0.2);
      doc.roundedRect(rightX, y, 88, 24, 2, 2, 'S');

      doc.setTextColor(...mid);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(s.label, rightX + 8, y + 7);
      doc.setTextColor(...s.color);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(`${s.count}  (${s.pct}%)`, rightX + 8, y + 16);
      doc.setTextColor(...mid);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(s.amt, rightX + 8, y + 22);
    });

    // ── Detailed bills table ───────────────────────────────────────
    const tableStartY = doc.lastAutoTable.finalY + 16;

    doc.setTextColor(...dark);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('DETAILED BILL RECORDS', 14, tableStartY);
    doc.setFillColor(...navy);
    doc.rect(14, tableStartY + 2, pageW - 28, 1, 'F');

    const sortedBills = [...bills].sort((a, b) => new Date(a.billIssueDate) - new Date(b.billIssueDate));

    autoTable(doc, {
      startY: tableStartY + 7,
      head: [['#', 'Bill No.', 'Issue Date', 'Usage (KWh)', 'Total (LKR)', 'Paid (LKR)', 'Balance (LKR)', 'Status']],
      body: sortedBills.map((bill, idx) => [
        idx + 1,
        bill.billNumber,
        new Date(bill.billIssueDate).toLocaleDateString('en-US', { year: '2-digit', month: 'short', day: '2-digit' }),
        bill.totalKWh.toLocaleString(),
        bill.totalPayment.toLocaleString(),
        (bill.totalPaid || 0).toLocaleString(),
        bill.balance.toLocaleString(),
        bill.isPaid ? 'PAID' : 'PENDING'
      ]),
      theme: 'plain',
      headStyles: { fillColor: navy, textColor: white, fontStyle: 'bold', fontSize: 9, cellPadding: { top: 5, bottom: 5, left: 4, right: 4 } },
      bodyStyles: { fontSize: 8.5, cellPadding: { top: 4, bottom: 4, left: 4, right: 4 }, textColor: dark },
      alternateRowStyles: { fillColor: lightBg },
      columnStyles: {
        0: { cellWidth: 9,  halign: 'center', textColor: light },
        1: { cellWidth: 25, fontStyle: 'bold', textColor: blue },
        2: { cellWidth: 22, halign: 'center' },
        3: { cellWidth: 24, halign: 'right', fontStyle: 'bold' },
        4: { cellWidth: 24, halign: 'right' },
        5: { cellWidth: 24, halign: 'right' },
        6: { cellWidth: 24, halign: 'right', fontStyle: 'bold' },
        7: { cellWidth: 24, halign: 'center', fontStyle: 'bold' }
      },
      margin: { left: 14, right: 14 },
      styles: { lineColor: border, lineWidth: 0.2 },
      showHead: 'everyPage',
      didParseCell: (data) => {
        if (data.section === 'body') {
          const bill = sortedBills[data.row.index];
          if (!bill) return;
          // Balance column
          if (data.column.index === 6) {
            data.cell.styles.textColor = bill.balance > 0 ? red : green;
          }
          // Status column
          if (data.column.index === 7) {
            data.cell.styles.textColor  = bill.isPaid ? green : amber;
            data.cell.styles.fillColor  = bill.isPaid ? [240, 255, 240] : [255, 250, 235];
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
    const filename = `PowerSense_Bills_Summary_${new Date().toISOString().slice(0, 10)}.pdf`;
    doc.save(filename);
  };

  const handleSendTestReminder = async () => {
    try {
      setSendingReminder(true);
      const response = await billService.sendTestReminder();
      alert(response?.data?.message || 'Test reminder sent successfully');
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to send test reminder');
    } finally {
      setSendingReminder(false);
    }
  };

  const filteredBills = bills.filter(bill => 
    bill.billNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          onClick={fetchBills}
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
      <div className="flex flex-col space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-textPrimary dark:text-gray-100">Electricity Bills</h1>
            <p className="text-textSecondary dark:text-gray-300 mt-1">Manage your monthly electricity bills</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={generateBillsSummaryPDF}
              className="btn-accent flex items-center"
              title="Download Bills Summary PDF"
            >
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM8 17v-1h8v1H8zm0-3v-1h8v1H8zm0-3V10h4v1H8z"/>
              </svg>
              Bill Summary
            </button>
            <button
              onClick={handleSendTestReminder}
              className="btn-secondary flex items-center"
              title="Send a test WhatsApp bill payment reminder"
              disabled={sendingReminder}
            >
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 14a1.5 1.5 0 110 3 1.5 1.5 0 010-3zm1-2h-2V7h2v7z"/>
              </svg>
              {sendingReminder ? 'Sending...' : 'Test Reminder'}
            </button>
            <button
              onClick={() => setIsInsightsModalOpen(true)}
              className="btn-secondary flex items-center"
            >
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 3v18h18V3H3zm16 16H5V5h14v14zM7 17h2V7H7v10zm4-6h2v6h-2v-6zm4-4h2v10h-2V7z"/>
              </svg>
              Insights
            </button>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="btn-primary flex items-center"
            >
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
              </svg>
              Add New Bill
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search by bill number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10 pr-4"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.3 5.71a.996.996 0 00-1.41 0L12 10.59 7.11 5.7A.996.996 0 105.7 7.11L10.59 12 5.7 16.89a.996.996 0 101.41 1.41L12 13.41l4.89 4.89a.996.996 0 101.41-1.41L13.41 12l4.89-4.89c.38-.38.38-1.02 0-1.4z"/>
                </svg>
              </button>
            )}
          </div>
          {searchTerm && (
            <div className="text-sm text-textSecondary dark:text-gray-400">
              {filteredBills.length} of {bills.length} bills found
            </div>
          )}
        </div>
      </div>

      {/* Empty State or Bills Display */}
      {filteredBills.length === 0 && searchTerm ? (
        <div className="text-center py-12">
          <div className="card card-gradient max-w-md mx-auto">
            <div className="card-body text-center">
              <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-amber-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M10 2C5.58 2 2 5.58 2 10s3.58 8 8 8c1.66 0 3.19-.5 4.47-1.35l3.54 3.54 1.41-1.41-3.54-3.54C18.5 13.19 19 11.66 19 10c0-4.42-3.58-8-8-8zm0 14c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-textPrimary dark:text-gray-100 mb-2">No bills found for "{searchTerm}"</h3>
              <p className="text-textSecondary dark:text-gray-300 mb-6">Try searching with a different bill number or clear the search to see all bills</p>
              <button
                onClick={() => setSearchTerm('')}
                className="btn-secondary inline-flex items-center"
              >
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.3 5.71a.996.996 0 00-1.41 0L12 10.59 7.11 5.7A.996.996 0 105.7 7.11L10.59 12 5.7 16.89a.996.996 0 101.41 1.41L12 13.41l4.89 4.89a.996.996 0 101.41-1.41L13.41 12l4.89-4.89c.38-.38.38-1.02 0-1.4z"/>
                </svg>
                Clear Search
              </button>
            </div>
          </div>
        </div>
      ) : filteredBills.length === 0 ? (
        <div className="text-center py-12">
          <div className="card card-gradient max-w-md mx-auto">
            <div className="card-body text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-primary" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"/>
                  <polyline points="14,2 14,8 20,8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                  <polyline points="10,9 9,9 8,9"/>
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-textPrimary dark:text-gray-100 mb-2">No bills found</h3>
              <p className="text-textSecondary dark:text-gray-300 mb-6">Start by creating your first electricity bill</p>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="btn-primary inline-flex items-center"
              >
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                </svg>
                Create Your First Bill
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="card overflow-hidden">
          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="table">
              <thead className="table-header">
                <tr>
                  <th>Bill Number</th>
                  <th>Issue Date</th>
                  <th>Usage (KWh)</th>
                  <th>Total Payment</th>
                  <th>Balance</th>
                  <th>Status</th>
                  <th>Photo</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBills.map((bill) => (
                  <tr key={bill._id} className="table-row">
                    <td className="table-cell font-medium text-textPrimary dark:text-gray-100">
                      #{bill.billNumber}
                    </td>
                    <td className="table-cell">
                      {formatDate(bill.billIssueDate)}
                    </td>
                    <td className="table-cell">
                      <span className="font-semibold text-textPrimary dark:text-gray-200">{bill.totalKWh}</span> 
                      <span className="text-textSecondary dark:text-gray-400"> KWh</span>
                    </td>
                    <td className="table-cell font-semibold text-textPrimary dark:text-gray-200">
                      {formatCurrency(bill.totalPayment)}
                    </td>
                    <td className="table-cell">
                      <span className={`font-semibold ${
                        bill.balance > 0 
                          ? 'text-red-600 dark:text-red-400' 
                          : 'text-green-600 dark:text-green-400'
                      }`}>
                        {formatCurrency(bill.balance)}
                      </span>
                    </td>
                    <td className="table-cell">
                      <span className={`badge ${
                        bill.isPaid ? 'badge-success' : 'badge-warning'
                      }`}>
                        {bill.isPaid ? (
                          <>
                            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                            </svg>
                            Paid
                          </>
                        ) : (
                          <>
                            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                            </svg>
                            Pending
                          </>
                        )}
                      </span>
                    </td>
                    <td className="table-cell">
                      {bill.billPhoto ? (
                        <button
                          onClick={() => handleViewPhoto(bill)}
                          className="btn-secondary btn-sm flex items-center"
                          title="View bill photo"
                        >
                          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                          </svg>
                          View
                        </button>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-500 text-sm">No photo</span>
                      )}
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEditBill(bill)}
                          className="btn-ghost btn-sm text-secondary hover:text-primary dark:text-secondary dark:hover:text-primary-light"
                          title="Edit bill"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(bill._id)}
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
            {filteredBills.map((bill) => (
              <div key={bill._id} className="card-hover p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-textPrimary dark:text-gray-100">#{bill.billNumber}</h3>
                    <p className="text-sm text-textSecondary dark:text-gray-400">{formatDate(bill.billIssueDate)}</p>
                  </div>
                  <span className={`badge ${
                    bill.isPaid ? 'badge-success' : 'badge-warning'
                  }`}>
                    {bill.isPaid ? 'Paid' : 'Pending'}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                  <div>
                    <span className="text-textSecondary dark:text-gray-400">Usage</span>
                    <p className="font-semibold text-textPrimary dark:text-gray-200">{bill.totalKWh} KWh</p>
                  </div>
                  <div>
                    <span className="text-textSecondary dark:text-gray-400">Total</span>
                    <p className="font-semibold text-textPrimary dark:text-gray-200">{formatCurrency(bill.totalPayment)}</p>
                  </div>
                  <div>
                    <span className="text-textSecondary dark:text-gray-400">Balance</span>
                    <p className={`font-semibold ${
                      bill.balance > 0 
                        ? 'text-red-600 dark:text-red-400' 
                        : 'text-green-600 dark:text-green-400'
                    }`}>
                      {formatCurrency(bill.balance)}
                    </p>
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  {bill.billPhoto && (
                    <button
                      onClick={() => handleViewPhoto(bill)}
                      className="btn-secondary btn-sm flex items-center"
                    >
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                      </svg>
                      View Photo
                    </button>
                  )}
                  <button
                    onClick={() => handleEditBill(bill)}
                    className="btn-secondary btn-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(bill._id)}
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

      {/* Create Bill Modal */}
      <CreateBillModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onBillCreated={handleBillCreated}
      />

      {/* Insights Modal */}
      <InsightsModal
        isOpen={isInsightsModalOpen}
        onClose={() => setIsInsightsModalOpen(false)}
      />

      {/* Edit Bill Modal */}
      <EditBillModal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        billData={editBillData}
        onBillUpdated={handleBillUpdated}
      />

      {/* Photo View Modal */}
      {selectedPhoto && (
        <div
          className={`fixed inset-0 z-50 overflow-y-auto ${
            isPhotoModalOpen ? 'block' : 'hidden'
          }`}
        >
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            {/* Background overlay */}
            <div
              className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75"
              onClick={handleClosePhotoModal}
            />

            {/* Modal content */}
            <div className="relative inline-block px-4 pt-5 pb-4 overflow-hidden text-left align-bottom transition-all transform bg-white dark:bg-gray-800 rounded-lg shadow-xl sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full sm:p-6">
              {/* Close button */}
              <button
                onClick={handleClosePhotoModal}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.3 5.71a.996.996 0 00-1.41 0L12 10.59 7.11 5.7A.996.996 0 105.7 7.11L10.59 12 5.7 16.89a.996.996 0 101.41 1.41L12 13.41l4.89 4.89a.996.996 0 101.41-1.41L13.41 12l4.89-4.89c.38-.38.38-1.02 0-1.4z"/>
                </svg>
              </button>

              {/* Photo content */}
              <div className="mt-3 text-center">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                  Bill Photo
                </h3>
                <div className="mt-2">
                  <img
                    src={`http://localhost:5000/uploads/bills/${selectedPhoto}`}
                    alt="Bill"
                    className="max-w-full max-h-[70vh] mx-auto rounded-lg shadow-lg"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'block';
                    }}
                  />
                  <div className="hidden text-gray-500 dark:text-gray-400 py-8">
                    Failed to load image
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BillList;
