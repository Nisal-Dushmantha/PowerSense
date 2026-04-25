import React, { useState, useEffect } from 'react';
import { billService } from '../../services/api';
import { getApiRootUrl } from '../../services/runtimeApiBase';
import CreateBillModal from './CreateBillModal';
import EditBillModal from './EditBill';
import InsightsModal from './InsightsModal';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const API_ROOT_URL = getApiRootUrl();

const getBillPhotoUrl = (photoValue) => {
  if (!photoValue) return '';

  if (/^https?:\/\//i.test(photoValue)) {
    try {
      const parsed = new URL(photoValue);
      if (/(^|\.)localhost$/.test(parsed.hostname) || parsed.hostname === '127.0.0.1') {
        return `${API_ROOT_URL}${parsed.pathname}`;
      }
      return photoValue;
    } catch {
      return photoValue;
    }
  }

  const normalized = String(photoValue).replace(/^\/+/, '');
  if (normalized.startsWith('uploads/')) {
    return `${API_ROOT_URL}/${normalized}`;
  }

  return `${API_ROOT_URL}/uploads/bills/${normalized}`;
};

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

    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();

    const colors = {
      primary: [46, 204, 113],
      secondary: [39, 174, 96],
      accent: [241, 196, 15],
      ink: [44, 62, 80],
      muted: [108, 122, 137],
      border: [220, 232, 225],
      rowAlt: [246, 251, 248],
      white: [255, 255, 255],
      danger: [192, 57, 43],
      soft: [236, 249, 241],
      softBlue: [234, 246, 255]
    };

    const today = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const totalBills = bills.length;
    const paidBills = bills.filter((b) => b.isPaid).length;
    const totalKWh = bills.reduce((sum, b) => sum + (b.totalKWh || 0), 0);
    const totalAmount = bills.reduce((sum, b) => sum + (b.totalPayment || 0), 0);
    const totalBalance = bills.reduce((sum, b) => sum + (b.balance || 0), 0);
    const avgUsage = totalBills > 0 ? totalKWh / totalBills : 0;
    const avgAmount = totalBills > 0 ? totalAmount / totalBills : 0;
    const paymentProgress = totalAmount > 0 ? ((totalAmount - totalBalance) / totalAmount) * 100 : 100;

    doc.setFillColor(...colors.softBlue);
    doc.rect(0, 0, pageW, pageH, 'F');

    doc.setFillColor(220, 244, 232);
    doc.circle(pageW - 70, 62, 48, 'F');
    doc.setFillColor(210, 236, 252);
    doc.circle(pageW - 28, 38, 34, 'F');

    doc.setFillColor(...colors.primary);
    doc.roundedRect(28, 26, pageW - 56, 94, 14, 14, 'F');
    doc.setFillColor(...colors.secondary);
    doc.roundedRect(28, 110, pageW - 56, 10, 5, 5, 'F');

    doc.setTextColor(...colors.white);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(26);
    doc.text('PowerSense', 44, 64);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.text('Electricity Bills Summary Report', 44, 84);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(`Generated on ${today}`, pageW - 44, 58, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.text(`${totalBills} records`, pageW - 44, 76, { align: 'right' });

    const cardsY = 138;
    const cardGap = 10;
    const cardW = (pageW - 80 - cardGap * 3) / 4;
    const cardH = 82;

    const summaryCards = [
      {
        title: 'Bills',
        value: totalBills.toString(),
        note: `${paidBills} settled`,
        color: colors.primary
      },
      {
        title: 'Total Usage',
        value: `${totalKWh.toLocaleString()} kWh`,
        note: `${avgUsage.toFixed(1)} avg / bill`,
        color: colors.secondary
      },
      {
        title: 'Total Billed',
        value: formatCurrency(totalAmount),
        note: `${formatCurrency(avgAmount)} avg`,
        color: colors.accent
      },
      {
        title: 'Outstanding',
        value: formatCurrency(totalBalance),
        note: `${paymentProgress.toFixed(0)}% paid`,
        color: totalBalance > 0 ? colors.danger : colors.secondary
      }
    ];

    summaryCards.forEach((card, index) => {
      const x = 40 + index * (cardW + cardGap);
      doc.setFillColor(...colors.white);
      doc.roundedRect(x, cardsY, cardW, cardH, 10, 10, 'F');
      doc.setDrawColor(...colors.border);
      doc.roundedRect(x, cardsY, cardW, cardH, 10, 10, 'S');

      doc.setFillColor(...card.color);
      doc.roundedRect(x, cardsY, cardW, 7, 6, 6, 'F');

      doc.setTextColor(...colors.muted);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(card.title, x + 12, cardsY + 24);

      doc.setTextColor(...colors.ink);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text(card.value, x + 12, cardsY + 48);

      doc.setTextColor(...colors.muted);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.text(card.note, x + 12, cardsY + 67);
    });

    const highlightsY = cardsY + cardH + 14;
    doc.setFillColor(...colors.soft);
    doc.roundedRect(40, highlightsY, pageW - 80, 56, 10, 10, 'F');
    doc.setDrawColor(...colors.border);
    doc.roundedRect(40, highlightsY, pageW - 80, 56, 10, 10, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...colors.ink);
    doc.text('Highlights', 54, highlightsY + 20);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...colors.muted);
    doc.text(`Payment completion: ${paymentProgress.toFixed(1)}%`, 54, highlightsY + 38);
    doc.text(`Average monthly bill: ${formatCurrency(avgAmount)} | Average usage: ${avgUsage.toFixed(1)} kWh`, 230, highlightsY + 38);

    const sortedBills = [...bills].sort(
      (a, b) => new Date(b.billIssueDate) - new Date(a.billIssueDate)
    );

    autoTable(doc, {
      startY: highlightsY + 74,
      head: [['Bill Number', 'Issue Date', 'Usage (kWh)', 'Amount (LKR)', 'Balance (LKR)', 'Status']],
      body: sortedBills.map((bill) => [
        bill.billNumber,
        new Date(bill.billIssueDate).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: '2-digit'
        }),
        Number(bill.totalKWh || 0).toLocaleString(),
        Number(bill.totalPayment || 0).toLocaleString(),
        Number(bill.balance || 0).toLocaleString(),
        bill.isPaid ? 'Paid' : 'Pending'
      ]),
      theme: 'grid',
      margin: { left: 40, right: 40 },
      styles: {
        fontSize: 9,
        cellPadding: 7,
        textColor: colors.ink,
        lineColor: colors.border,
        lineWidth: 0.4,
        valign: 'middle'
      },
      headStyles: {
        fillColor: colors.secondary,
        textColor: colors.white,
        fontStyle: 'bold',
        halign: 'left'
      },
      alternateRowStyles: {
        fillColor: colors.rowAlt
      },
      columnStyles: {
        0: { fontStyle: 'bold' },
        2: { halign: 'right' },
        3: { halign: 'right' },
        4: { halign: 'right' },
        5: { halign: 'center', fontStyle: 'bold', cellWidth: 62 }
      },
      didParseCell: (data) => {
        if (data.section !== 'body') {
          return;
        }

        if (data.column.index === 4) {
          const balanceValue = Number(sortedBills[data.row.index]?.balance || 0);
          data.cell.styles.textColor = balanceValue > 0 ? colors.danger : colors.secondary;
        }

        if (data.column.index === 5) {
          const isPaid = Boolean(sortedBills[data.row.index]?.isPaid);
          data.cell.styles.textColor = isPaid ? colors.secondary : [170, 120, 0];
          data.cell.styles.fillColor = isPaid ? [232, 248, 240] : [255, 247, 220];
        }
      }
    });

    const totalPages = doc.internal.getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p);
      doc.setDrawColor(...colors.border);
      doc.line(28, 22, pageW - 28, 22);
      doc.setDrawColor(...colors.border);
      doc.line(40, pageH - 44, pageW - 40, pageH - 44);

      doc.setTextColor(...colors.muted);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text('PowerSense Bills Report', 40, pageH - 28);
      doc.text(`Page ${p} of ${totalPages}`, pageW - 40, pageH - 28, { align: 'right' });
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
                    src={getBillPhotoUrl(selectedPhoto)}
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
