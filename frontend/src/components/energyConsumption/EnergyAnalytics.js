import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  getPeakUsage,
  getThresholdAlerts,
  getCarbonFootprint,
  getUsageComparison,
  getRecommendations,
  updateEnergyThreshold,
  getEnergyRecords
} from '../../services/energyApi';

const CO2_FACTOR  = 0.527;
const TARIFF_RATE = 35;

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];

// ── Reusable stat card ────────────────────────────────────────
const StatCard = ({ icon, label, value, sub, color = 'green' }) => {
  const colors = {
    green:  { bg: 'bg-green-50 dark:bg-green-900/20',  text: 'text-green-700 dark:text-green-400',  border: 'border-green-200 dark:border-green-700' },
    blue:   { bg: 'bg-blue-50 dark:bg-blue-900/20',    text: 'text-blue-700 dark:text-blue-400',    border: 'border-blue-200 dark:border-blue-700' },
    purple: { bg: 'bg-purple-50 dark:bg-purple-900/20',text: 'text-purple-700 dark:text-purple-400',border: 'border-purple-200 dark:border-purple-700' },
    red:    { bg: 'bg-red-50 dark:bg-red-900/20',      text: 'text-red-700 dark:text-red-400',      border: 'border-red-200 dark:border-red-700' },
    yellow: { bg: 'bg-yellow-50 dark:bg-yellow-900/20',text: 'text-yellow-700 dark:text-yellow-400',border: 'border-yellow-200 dark:border-yellow-700' },
  };
  const c = colors[color] || colors.green;
  return (
    <div className={`rounded-xl border p-4 ${c.bg} ${c.border}`}>
      <div className="flex items-center space-x-3 mb-1">
        <span className="text-2xl">{icon}</span>
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">{label}</span>
      </div>
      <p className={`text-2xl font-bold ${c.text}`}>{value}</p>
      {sub && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{sub}</p>}
    </div>
  );
};

// ── Simple bar chart (pure CSS, no lib needed) ────────────────
const BarChart = ({ data, maxVal }) => {
  if (!data.length) return <p className="text-gray-400 text-sm text-center py-6">No data</p>;
  const max = maxVal || Math.max(...data.map(d => d.value));
  return (
    <div className="flex items-end space-x-1 h-40">
      {data.map((d, i) => (
        <div key={i} className="flex flex-col items-center flex-1 group" title={`${d.label}: ${d.value} kWh`}>
          <span className="text-xs mb-1 hidden group-hover:block absolute -mt-5 whitespace-nowrap bg-gray-800 text-white px-1 rounded text-[10px]">
            {d.value}
          </span>
          <div
            className="w-full rounded-t-md transition-all duration-500"
            style={{
              height: `${Math.max((d.value / max) * 100, 2)}%`,
              background: d.color || 'linear-gradient(to top, #16a34a, #4ade80)'
            }}
          />
          <span className="text-[9px] text-gray-400 mt-1 truncate w-full text-center">{d.label}</span>
        </div>
      ))}
    </div>
  );
};

// ── Main component ────────────────────────────────────────────
const EnergyAnalytics = () => {
  const navigate = useNavigate();
  const today    = new Date();

  // ── State ──
  const [activeSection, setActiveSection] = useState('peak');
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState(null);

  // Peak
  const [peakData, setPeakData]           = useState(null);
  const [peakFilter, setPeakFilter]       = useState('');

  // Alerts
  const [alertData, setAlertData]         = useState(null);
  const [threshold, setThreshold]         = useState('');
  const [thresholdSaving, setThresholdSaving] = useState(false);
  const [thresholdMsg, setThresholdMsg]   = useState(null);

  // Carbon
  const [carbonData, setCarbonData]       = useState(null);
  const [carbonFilter, setCarbonFilter]   = useState({ startDate: '', endDate: '' });

  // Comparison
  const [compData, setCompData]           = useState(null);
  const [compFilter, setCompFilter]       = useState({
    currentStart:  new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0],
    currentEnd:    today.toISOString().split('T')[0],
    previousStart: new Date(today.getFullYear(), today.getMonth() - 1, 1).toISOString().split('T')[0],
    previousEnd:   new Date(today.getFullYear(), today.getMonth(), 0).toISOString().split('T')[0]
  });

  // Recommendations
  const [recData, setRecData]             = useState(null);

  // PDF
  const [pdfMonth, setPdfMonth]           = useState(today.getMonth() + 1);
  const [pdfYear, setPdfYear]             = useState(today.getFullYear());
  const [pdfLoading, setPdfLoading]       = useState(false);

  // ── Loaders ──
  const loadPeak = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await getPeakUsage({ limit: 10, period_type: peakFilter || undefined });
      setPeakData(res.data);
    } catch { setError('Failed to load peak data'); }
    finally { setLoading(false); }
  }, [peakFilter]);

  const loadAlerts = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await getThresholdAlerts();
      setAlertData(res.data);
      if (res.data.threshold != null) setThreshold(String(res.data.threshold));
    } catch { setError('Failed to load alerts'); }
    finally { setLoading(false); }
  }, []);

  const loadCarbon = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await getCarbonFootprint(carbonFilter);
      setCarbonData(res.data);
    } catch { setError('Failed to load carbon data'); }
    finally { setLoading(false); }
  }, [carbonFilter]);

  const loadComparison = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await getUsageComparison(compFilter);
      setCompData(res.data);
    } catch { setError('Failed to load comparison'); }
    finally { setLoading(false); }
  }, [compFilter]);

  const loadRecs = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await getRecommendations();
      setRecData(res.data);
    } catch { setError('Failed to load recommendations'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (activeSection === 'peak')         loadPeak();
    else if (activeSection === 'alerts')  loadAlerts();
    else if (activeSection === 'carbon')  loadCarbon();
    else if (activeSection === 'compare') loadComparison();
    else if (activeSection === 'recs')    loadRecs();
  }, [activeSection, loadPeak, loadAlerts, loadCarbon, loadComparison, loadRecs]);

  // ── Threshold save ──
  const handleSaveThreshold = async () => {
    setThresholdSaving(true); setThresholdMsg(null);
    try {
      await updateEnergyThreshold(threshold === '' ? null : parseFloat(threshold));
      setThresholdMsg({ type: 'success', text: 'Threshold saved! Refreshing alerts…' });
      await loadAlerts();
    } catch { setThresholdMsg({ type: 'error', text: 'Failed to save threshold.' }); }
    finally { setThresholdSaving(false); }
  };

  // ── PDF download (client-side jsPDF) ──
  const handleDownloadPdf = async () => {
    setPdfLoading(true);
    try {
      // Build date range for the selected month/year
      const startDate = new Date(pdfYear, pdfMonth - 1, 1).toISOString().split('T')[0];
      const endDate   = new Date(pdfYear, pdfMonth, 0).toISOString().split('T')[0];
      const res       = await getEnergyRecords({ startDate, endDate });
      const records   = res.data || [];

      const doc    = new jsPDF({ unit: 'mm', format: 'a4' });
      const pageW  = 210;
      const pageH  = 297;
      const mg     = 14;
      const now    = new Date();
      const monthLabel = MONTH_NAMES[pdfMonth - 1];
      const reportId   = `EC-${pdfYear}${String(pdfMonth).padStart(2,'0')}-${String(now.getHours()).padStart(2,'0')}${String(now.getMinutes()).padStart(2,'0')}`;
      const fmtDate    = (d) => new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

      // Palette
      const navy   = [11, 20, 38];
      const navyL  = [21, 35, 64];
      const blue   = [37, 99, 235];
      const teal   = [20, 184, 166];
      const green  = [22, 163, 74];
      const amber  = [217, 119, 6];
      const orange = [234, 88, 12];
      const red    = [220, 38, 38];
      const white  = [255, 255, 255];
      const slate  = [100, 116, 139];
      const slateL = [148, 163, 184];
      const dark   = [15, 23, 42];
      const bg     = [248, 250, 252];
      const border = [226, 232, 240];

      const getLevel = (kwh) => {
        if (kwh <= 50)  return 'LOW';
        if (kwh <= 150) return 'MODERATE';
        if (kwh <= 300) return 'HIGH';
        return 'CRITICAL';
      };
      const levelColor = { LOW: green, MODERATE: amber, HIGH: orange, CRITICAL: red };

      const drawFooter = (pageNum) => {
        doc.setFillColor(...navy);
        doc.rect(0, pageH - 13, pageW, 13, 'F');
        doc.setFillColor(...blue);
        doc.rect(0, pageH - 13, pageW, 1.2, 'F');
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...slateL);
        doc.text('PowerSense  ·  Energy Management Platform  ·  CONFIDENTIAL', mg, pageH - 5);
        doc.text(`Page ${pageNum}`, pageW - mg, pageH - 5, { align: 'right' });
        doc.text(`Report ID: ${reportId}`, pageW / 2, pageH - 5, { align: 'center' });
      };

      const drawWatermark = () => {
        doc.saveGraphicsState();
        doc.setGState(new doc.GState({ opacity: 0.04 }));
        doc.setFontSize(52);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...navy);
        doc.text('POWERSENSE', pageW / 2, pageH / 2, { align: 'center', angle: 45 });
        doc.restoreGraphicsState();
      };

      /* ── Header banner ── */
      doc.setFillColor(...navy);
      doc.rect(0, 0, pageW, 42, 'F');
      doc.setFillColor(...blue);
      doc.rect(0, 0, pageW, 3, 'F');
      doc.setFillColor(...teal);
      doc.rect(0, 42, pageW, 1.5, 'F');

      // Logo
      doc.setFillColor(...blue);
      doc.roundedRect(mg, 10, 20, 20, 2.5, 2.5, 'F');
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...white);
      doc.text('PS', mg + 5.2, 22.5);

      // Brand name
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...white);
      doc.text('PowerSense', mg + 24, 19);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...slateL);
      doc.text('Energy Management Platform', mg + 24, 26);

      // Report title right
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...white);
      doc.text('MONTHLY ENERGY REPORT', pageW - mg, 17, { align: 'right' });
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...slateL);
      doc.text(`${monthLabel} ${pdfYear}`, pageW - mg, 24, { align: 'right' });
      doc.setFontSize(7.5);
      doc.text(`Report ID: ${reportId}`, pageW - mg, 30, { align: 'right' });
      doc.text(`Generated: ${now.toLocaleDateString('en-GB')}  ${now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`, pageW - mg, 36, { align: 'right' });

      /* ── KPI cards ── */
      const totalKwh  = records.reduce((s, r) => s + (r.energy_used_kwh || 0), 0);
      const totalCo2  = totalKwh * CO2_FACTOR;
      const totalCost = totalKwh * TARIFF_RATE;
      const avgKwh    = records.length > 0 ? totalKwh / records.length : 0;
      const peakKwh   = records.length > 0 ? Math.max(...records.map(r => r.energy_used_kwh || 0)) : 0;
      const critCount = records.filter(r => getLevel(r.energy_used_kwh) === 'CRITICAL').length;

      const kpiY  = 50;
      const kpiH  = 26;
      const kpiGp = 3;
      const kpiW  = (pageW - mg * 2 - kpiGp * 3) / 4;

      const kpis = [
        { label: 'TOTAL READINGS',  value: String(records.length),       sub: `${monthLabel} ${pdfYear}`,   color: [99, 102, 241] },
        { label: 'TOTAL USAGE',     value: `${totalKwh.toFixed(1)} kWh`, sub: 'cumulative',                 color: blue  },
        { label: 'EST. CO\u2082',       value: `${totalCo2.toFixed(1)} kg`, sub: '0.527 kg/kWh factor',        color: green },
        { label: 'EST. TOTAL COST', value: `Rs.${totalCost.toFixed(0)}`, sub: 'at Rs.35/kWh',               color: teal  },
      ];

      kpis.forEach((kpi, i) => {
        const x = mg + i * (kpiW + kpiGp);
        doc.setFillColor(218, 220, 228);
        doc.roundedRect(x + 0.8, kpiY + 0.8, kpiW, kpiH, 2.5, 2.5, 'F');
        doc.setFillColor(...bg);
        doc.roundedRect(x, kpiY, kpiW, kpiH, 2.5, 2.5, 'F');
        doc.setFillColor(...kpi.color);
        doc.roundedRect(x, kpiY, kpiW, 3, 1, 1, 'F');
        doc.setFontSize(6.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...slate);
        doc.text(kpi.label, x + 5, kpiY + 9);
        doc.setFontSize(11.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...dark);
        doc.text(kpi.value, x + 5, kpiY + 19);
        doc.setFontSize(6.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...slateL);
        doc.text(kpi.sub, x + 5, kpiY + 24.5);
      });

      /* ── Two-column insight section ── */
      const insY = kpiY + kpiH + 5;
      const colW = (pageW - mg * 2 - 4) / 2;

      // Left card: additional stats
      const lcX = mg;
      const lcH = 34;
      doc.setFillColor(218, 220, 228);
      doc.roundedRect(lcX + 0.7, insY + 0.7, colW, lcH, 2, 2, 'F');
      doc.setFillColor(...bg);
      doc.roundedRect(lcX, insY, colW, lcH, 2, 2, 'F');
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...dark);
      doc.text('CONSUMPTION HIGHLIGHTS', lcX + 5, insY + 7);

      const highlights = [
        { label: 'Peak Reading',      value: `${peakKwh.toFixed(2)} kWh`,   color: dark  },
        { label: 'Average per Record',value: `${avgKwh.toFixed(2)} kWh`,    color: dark  },
        { label: 'Critical Alerts',   value: String(critCount),              color: critCount > 0 ? red : green },
      ];
      highlights.forEach((h, i) => {
        const hy = insY + 13 + i * 8;
        if (i > 0) {
          doc.setDrawColor(...border);
          doc.setLineWidth(0.2);
          doc.line(lcX + 5, hy - 2, lcX + colW - 5, hy - 2);
        }
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...slate);
        doc.text(h.label, lcX + 5, hy + 3);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...h.color);
        doc.text(h.value, lcX + colW - 5, hy + 3, { align: 'right' });
      });

      // Right card: usage level distribution bar chart
      const rcX = mg + colW + 4;
      const rcH = 34;
      doc.setFillColor(218, 220, 228);
      doc.roundedRect(rcX + 0.7, insY + 0.7, colW, rcH, 2, 2, 'F');
      doc.setFillColor(...bg);
      doc.roundedRect(rcX, insY, colW, rcH, 2, 2, 'F');
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...dark);
      doc.text('USAGE LEVEL DISTRIBUTION', rcX + 5, insY + 7);

      const levelData = [
        { label: 'Low',      color: green,  count: records.filter(r => getLevel(r.energy_used_kwh) === 'LOW').length },
        { label: 'Moderate', color: amber,  count: records.filter(r => getLevel(r.energy_used_kwh) === 'MODERATE').length },
        { label: 'High',     color: orange, count: records.filter(r => getLevel(r.energy_used_kwh) === 'HIGH').length },
        { label: 'Critical', color: red,    count: records.filter(r => getLevel(r.energy_used_kwh) === 'CRITICAL').length },
      ];
      const barMaxW = colW - 44;
      levelData.forEach((b, i) => {
        const by  = insY + 12 + i * 6.5;
        const fw  = records.length > 0 ? (b.count / records.length) * barMaxW : 0;
        doc.setFontSize(6.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...slate);
        doc.text(b.label, rcX + 5, by + 4.5);
        doc.setFillColor(...border);
        doc.roundedRect(rcX + 24, by, barMaxW, 5.5, 1, 1, 'F');
        if (fw > 0) {
          doc.setFillColor(...b.color);
          doc.roundedRect(rcX + 24, by, fw, 5.5, 1, 1, 'F');
        }
        doc.setFontSize(6.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...b.color);
        doc.text(`${b.count}`, rcX + 24 + barMaxW + 2.5, by + 4.5);
      });

      /* ── Section heading ── */
      const tblY = insY + lcH + 5;
      doc.setFillColor(...navyL);
      doc.roundedRect(mg, tblY, pageW - mg * 2, 8, 1, 1, 'F');
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...white);
      doc.text('METER READING DETAILS', mg + 4, tblY + 5.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...slateL);
      doc.text(`${records.length} record(s)  ·  ${monthLabel} ${pdfYear}`, pageW - mg - 4, tblY + 5.5, { align: 'right' });

      /* ── Table ── */
      if (records.length === 0) {
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...slateL);
        doc.text(`No energy records found for ${monthLabel} ${pdfYear}.`, mg, tblY + 18);
      } else {
        autoTable(doc, {
          startY: tblY + 10,
          margin: { left: mg, right: mg },
          head: [['#', 'Meter ID', 'Date', 'Period', 'Usage (kWh)', 'Level', 'CO\u2082 (kg)', 'Cost (Rs.)']],
          body: records.map((r, idx) => {
            const lvl = getLevel(r.energy_used_kwh);
            return [
              idx + 1,
              r.meter_id || `Meter #${r._id?.slice(-4) || '----'}`,
              fmtDate(r.consumption_date),
              r.period_type ? r.period_type.charAt(0).toUpperCase() + r.period_type.slice(1) : 'N/A',
              (r.energy_used_kwh || 0).toFixed(2),
              lvl,
              (r.energy_used_kwh * CO2_FACTOR).toFixed(2),
              (r.energy_used_kwh * TARIFF_RATE).toFixed(2),
            ];
          }),
          styles: {
            fontSize: 8,
            cellPadding: { top: 3.5, bottom: 3.5, left: 3.5, right: 3.5 },
            textColor: dark,
            lineColor: border,
            lineWidth: 0.25,
          },
          headStyles: {
            fillColor: navy,
            textColor: white,
            fontStyle: 'bold',
            fontSize: 7.5,
            cellPadding: { top: 4.5, bottom: 4.5, left: 3.5, right: 3.5 },
          },
          alternateRowStyles: { fillColor: bg },
          columnStyles: {
            0: { halign: 'center', fontStyle: 'bold', textColor: slate, cellWidth: 8 },
            1: { fontStyle: 'bold' },
            4: { halign: 'right' },
            5: { halign: 'center', fontStyle: 'bold' },
            6: { halign: 'right' },
            7: { halign: 'right' },
          },
          didParseCell: (data) => {
            if (data.section === 'body' && data.column.index === 5) {
              data.cell.styles.textColor = levelColor[data.cell.raw] || dark;
            }
          },
          foot: [['', '', '', 'TOTALS', `${totalKwh.toFixed(2)}`, '', `${totalCo2.toFixed(2)}`, `${totalCost.toFixed(2)}`]],
          footStyles: { fillColor: navy, textColor: white, fontStyle: 'bold', fontSize: 8 },
          didDrawPage: (data) => {
            drawWatermark();
            drawFooter(data.pageNumber + 1);
            if (data.pageNumber > 1) {
              doc.setFillColor(...navy);
              doc.rect(0, 0, pageW, 12, 'F');
              doc.setFillColor(...blue);
              doc.rect(0, 11, pageW, 1.2, 'F');
              doc.setFontSize(8);
              doc.setFont('helvetica', 'bold');
              doc.setTextColor(...white);
              doc.text('PowerSense', mg, 8);
              doc.setFont('helvetica', 'normal');
              doc.setTextColor(...slateL);
              doc.text(`Energy Report  ·  ${monthLabel} ${pdfYear}  (continued)`, mg + 28, 8);
            }
          },
        });
      }

      /* ── Disclaimer ── */
      const afterY = records.length > 0 ? doc.lastAutoTable.finalY + 6 : tblY + 28;
      if (afterY < pageH - 32) {
        doc.setFillColor(...bg);
        doc.roundedRect(mg, afterY, pageW - mg * 2, 16, 2, 2, 'F');
        doc.setDrawColor(...border);
        doc.setLineWidth(0.3);
        doc.roundedRect(mg, afterY, pageW - mg * 2, 16, 2, 2, 'S');
        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...slate);
        doc.text('DISCLAIMER', mg + 4, afterY + 5.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...slateL);
        doc.text(
          `This report covers ${monthLabel} ${pdfYear}. CO\u2082 estimates use IPCC emission factor of ${CO2_FACTOR} kg/kWh. ` +
          `Cost estimates are at Rs.${TARIFF_RATE}/kWh. Thresholds: Low \u226450, Moderate \u2264150, High \u2264300, Critical >300 kWh. ` +
          'This document is confidential and intended for authorised users only.',
          mg + 4, afterY + 11,
          { maxWidth: pageW - mg * 2 - 8 }
        );
      }

      drawFooter(1);
      drawWatermark();

      doc.save(`PowerSense-Energy-Report-${monthLabel}-${pdfYear}.pdf`);
    } catch (err) {
      console.error('PDF generation failed:', err);
      alert('Failed to generate PDF report.');
    } finally {
      setPdfLoading(false);
    }
  };

  // ── Nav tabs ──
  const tabs = [
    { id: 'peak',    icon: '⚡', label: 'Peak Usage' },
    { id: 'alerts',  icon: '🔔', label: 'Threshold Alerts' },
    { id: 'carbon',  icon: '🌿', label: 'Carbon Footprint' },
    { id: 'compare', icon: '📊', label: 'Usage Comparison' },
    { id: 'recs',    icon: '💡', label: 'Recommendations' },
    { id: 'pdf',     icon: '📄', label: 'PDF Report' },
  ];

  const recColors = { warning: 'yellow', alert: 'red', success: 'green', tip: 'blue', info: 'purple' };

  // ── Render ──
  return (
    <div className="min-h-screen bg-gradient-to-br from-light-mint via-white to-background dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6">
      <div className="max-w-6xl mx-auto">

        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <button
              onClick={() => navigate('/consumption')}
              className="flex items-center text-sm text-gray-500 dark:text-gray-400 hover:text-primary mb-2 transition-colors"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
              </svg>
              Back to Readings
            </button>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">📈 Energy Analytics</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Insights, alerts and reports from your meter data</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 mb-8 bg-white dark:bg-gray-800 p-2 rounded-2xl shadow border border-gray-100 dark:border-gray-700">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveSection(t.id)}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                activeSection === t.id
                  ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-md shadow-primary/30 scale-105'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <span>{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        {/* Error banner */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-400 rounded-xl px-4 py-3 mb-6 text-sm">
            ⚠️ {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
            <span className="ml-3 text-gray-500 dark:text-gray-400">Loading…</span>
          </div>
        )}

        {/* ──────── PEAK USAGE ──────── */}
        {activeSection === 'peak' && !loading && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow border border-gray-100 dark:border-gray-700 p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">⚡ Peak Usage Detection</h2>
                <select
                  value={peakFilter}
                  onChange={e => setPeakFilter(e.target.value)}
                  className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">All Periods</option>
                  <option value="hourly">Hourly</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>

              {peakData && (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                    <StatCard icon="⚡" label="Peak Reading" value={`${peakData.peak} kWh`} color="red" />
                    <StatCard icon="📊" label="Avg (Top 10)" value={`${peakData.average} kWh`} color="blue" />
                    <StatCard icon="🌿" label="Peak CO₂" value={`${(peakData.peak * CO2_FACTOR).toFixed(2)} kg`} color="green" />
                    <StatCard icon="💰" label="Peak Cost" value={`Rs. ${(peakData.peak * TARIFF_RATE).toFixed(0)}`} color="purple" />
                  </div>

                  {/* Table */}
                  <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
                    <table className="min-w-full text-sm">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          {['Meter ID','Date','kWh','Period','CO₂ (kg)','Cost (Rs.)'].map(h => (
                            <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {peakData.records.map((r, i) => (
                          <tr key={i} className={i === 0 ? 'bg-red-50 dark:bg-red-900/10' : 'bg-white dark:bg-gray-800'}>
                            <td className="px-4 py-3 font-mono text-xs font-semibold text-primary">{r.meter_id || '—'}</td>
                            <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{new Date(r.date).toLocaleDateString('en-GB')}</td>
                            <td className="px-4 py-3 font-bold text-gray-900 dark:text-white">{r.energy_used_kwh}</td>
                            <td className="px-4 py-3 capitalize text-gray-600 dark:text-gray-400">{r.period_type}</td>
                            <td className="px-4 py-3 text-green-600 dark:text-green-400">{r.co2_kg}</td>
                            <td className="px-4 py-3 text-blue-600 dark:text-blue-400">{(r.energy_used_kwh * TARIFF_RATE).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* ──────── THRESHOLD ALERTS ──────── */}
        {activeSection === 'alerts' && !loading && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow border border-gray-100 dark:border-gray-700 p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">🔔 Energy Threshold Alerts</h2>

              {/* Threshold setter */}
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-xl p-5 mb-6">
                <label className="block text-sm font-semibold text-yellow-800 dark:text-yellow-400 mb-3">
                  Set Alert Threshold (kWh)
                </label>
                <p className="text-xs text-yellow-700 dark:text-yellow-500 mb-3">
                  Any meter reading above this value will be flagged as an alert.
                </p>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={threshold}
                    onChange={e => setThreshold(e.target.value)}
                    onKeyDown={e => ['-','e','E','+'].includes(e.key) && e.preventDefault()}
                    placeholder="e.g. 150"
                    className="border border-yellow-300 dark:border-yellow-600 rounded-lg px-3 py-2 text-sm w-40 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  />
                  <button
                    onClick={handleSaveThreshold}
                    disabled={thresholdSaving}
                    className="px-5 py-2 bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
                  >
                    {thresholdSaving ? 'Saving…' : 'Save Threshold'}
                  </button>
                  {threshold && (
                    <button
                      onClick={() => { setThreshold(''); handleSaveThreshold(); }}
                      className="text-xs text-gray-500 hover:text-red-500 transition-colors"
                    >
                      Clear
                    </button>
                  )}
                </div>
                {thresholdMsg && (
                  <p className={`mt-2 text-xs font-medium ${thresholdMsg.type === 'success' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {thresholdMsg.text}
                  </p>
                )}
              </div>

              {alertData && (
                alertData.threshold == null ? (
                  <div className="text-center py-10 text-gray-400 dark:text-gray-500">
                    <div className="text-5xl mb-3">🔔</div>
                    <p className="font-medium">No threshold set yet.</p>
                    <p className="text-sm">Set a threshold above to start receiving alerts.</p>
                  </div>
                ) : alertData.count === 0 ? (
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-xl p-5 text-center">
                    <div className="text-4xl mb-2">✅</div>
                    <p className="font-semibold text-green-700 dark:text-green-400">All readings are within threshold!</p>
                    <p className="text-sm text-green-600 dark:text-green-500">Threshold: {alertData.threshold} kWh</p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
                      <StatCard icon="🔔" label="Alerts" value={alertData.count} sub="readings exceeded" color="red" />
                      <StatCard icon="📏" label="Threshold" value={`${alertData.threshold} kWh`} color="yellow" />
                      <StatCard icon="📈" label="Max Exceeded" value={`+${Math.max(...alertData.alerts.map(a => a.exceeded_by))} kWh`} color="red" />
                    </div>
                    <div className="overflow-x-auto rounded-xl border border-red-200 dark:border-red-700">
                      <table className="min-w-full text-sm">
                        <thead className="bg-red-50 dark:bg-red-900/20">
                          <tr>
                            {['Meter ID','Date','kWh','Exceeded By','Period'].map(h => (
                              <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-red-600 dark:text-red-400 uppercase">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-red-100 dark:divide-red-900/30">
                          {alertData.alerts.map((a, i) => (
                            <tr key={i} className="bg-white dark:bg-gray-800">
                              <td className="px-4 py-3 font-mono text-xs font-semibold text-primary">{a.meter_id || '—'}</td>
                              <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{new Date(a.date).toLocaleDateString('en-GB')}</td>
                              <td className="px-4 py-3 font-bold text-red-600 dark:text-red-400">{a.energy_used_kwh}</td>
                              <td className="px-4 py-3 text-red-500">+{a.exceeded_by} kWh</td>
                              <td className="px-4 py-3 capitalize text-gray-500 dark:text-gray-400">{a.period_type}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )
              )}
            </div>
          </div>
        )}

        {/* ──────── CARBON FOOTPRINT ──────── */}
        {activeSection === 'carbon' && !loading && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow border border-gray-100 dark:border-gray-700 p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">🌿 Carbon Footprint Calculation</h2>

              {/* Date filter */}
              <div className="flex flex-wrap gap-3 mb-6">
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">From</label>
                  <input type="date" value={carbonFilter.startDate}
                    onChange={e => setCarbonFilter(p => ({ ...p, startDate: e.target.value }))}
                    className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">To</label>
                  <input type="date" value={carbonFilter.endDate}
                    onChange={e => setCarbonFilter(p => ({ ...p, endDate: e.target.value }))}
                    className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div className="flex items-end">
                  <button onClick={loadCarbon}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg transition-colors">
                    Apply
                  </button>
                </div>
              </div>

              {carbonData && (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                    <StatCard icon="⚡" label="Total Energy" value={`${carbonData.total_kwh} kWh`} sub={`${carbonData.count} records`} color="blue" />
                    <StatCard icon="🌿" label="CO₂ Emission" value={`${carbonData.co2_kg} kg`} color="green" />
                    <StatCard icon="🌍" label="CO₂ in Tonnes" value={`${carbonData.co2_tonnes} t`} color="purple" />
                    <StatCard icon="📏" label="CO₂ Factor" value={`${CO2_FACTOR} kg/kWh`} sub="Sri Lanka grid" color="yellow" />
                  </div>

                  {/* Equivalencies */}
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-xl p-5 mb-6">
                    <h3 className="font-semibold text-green-800 dark:text-green-400 mb-3 text-sm">🌱 That's equivalent to…</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl">🚗</span>
                        <span className="text-gray-700 dark:text-gray-300">{(carbonData.co2_kg / 0.21).toFixed(0)} km driven by car</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl">🌳</span>
                        <span className="text-gray-700 dark:text-gray-300">{(carbonData.co2_kg / 22).toFixed(1)} trees needed for 1 year</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl">💡</span>
                        <span className="text-gray-700 dark:text-gray-300">{(carbonData.co2_kg / 0.005).toFixed(0)} LED bulb-hours</span>
                      </div>
                    </div>
                  </div>

                  {/* Monthly breakdown chart */}
                  {carbonData.monthly.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3">Monthly CO₂ (kg)</h3>
                      <BarChart
                        data={carbonData.monthly.map(m => ({
                          label: `${MONTH_NAMES[m.month - 1].slice(0,3)} ${m.year}`,
                          value: m.co2_kg,
                          color: 'linear-gradient(to top, #16a34a, #86efac)'
                        }))}
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* ──────── USAGE COMPARISON ──────── */}
        {activeSection === 'compare' && !loading && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow border border-gray-100 dark:border-gray-700 p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">📊 Energy Usage Comparison</h2>

              {/* Period selectors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-blue-700 dark:text-blue-400 mb-3">Current Period</h3>
                  <div className="flex flex-col gap-2">
                    <input type="date" value={compFilter.currentStart}
                      onChange={e => setCompFilter(p => ({ ...p, currentStart: e.target.value }))}
                      className="border border-blue-300 dark:border-blue-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                    <input type="date" value={compFilter.currentEnd}
                      onChange={e => setCompFilter(p => ({ ...p, currentEnd: e.target.value }))}
                      className="border border-blue-300 dark:border-blue-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3">Previous Period</h3>
                  <div className="flex flex-col gap-2">
                    <input type="date" value={compFilter.previousStart}
                      onChange={e => setCompFilter(p => ({ ...p, previousStart: e.target.value }))}
                      className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                    <input type="date" value={compFilter.previousEnd}
                      onChange={e => setCompFilter(p => ({ ...p, previousEnd: e.target.value }))}
                      className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>
              <button onClick={loadComparison}
                className="mb-6 px-5 py-2 bg-primary hover:bg-primary-dark text-white text-sm font-semibold rounded-lg transition-colors">
                Compare Periods
              </button>

              {compData && (
                <>
                  {/* Trend badge */}
                  <div className="flex justify-center mb-6">
                    <div className={`inline-flex items-center space-x-2 px-5 py-2.5 rounded-full text-sm font-bold shadow ${
                      compData.trend === 'up'     ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                      compData.trend === 'down'   ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                      compData.trend === 'stable' ? 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300' :
                      'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                    }`}>
                      <span>{compData.trend === 'up' ? '📈' : compData.trend === 'down' ? '📉' : '➡️'}</span>
                      <span>
                        {compData.trend === 'no-data' ? 'No previous data'
                          : compData.change_pct === null ? 'No change data'
                          : `${compData.change_pct > 0 ? '+' : ''}${compData.change_pct}% vs previous period`}
                      </span>
                    </div>
                  </div>

                  {/* Side-by-side cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                    {/* Current */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl p-5">
                      <h3 className="text-sm font-semibold text-blue-700 dark:text-blue-400 mb-4">Current Period</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400 text-sm">Energy</span><span className="font-bold text-blue-700 dark:text-blue-300">{compData.current.kwh} kWh</span></div>
                        <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400 text-sm">CO₂</span><span className="font-bold text-green-600 dark:text-green-400">{compData.current.co2_kg} kg</span></div>
                        <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400 text-sm">Est. Cost</span><span className="font-bold text-purple-600 dark:text-purple-400">Rs. {compData.current.cost}</span></div>
                        <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400 text-sm">Readings</span><span className="font-bold text-gray-700 dark:text-gray-300">{compData.current.count}</span></div>
                      </div>
                    </div>
                    {/* Previous */}
                    <div className="bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl p-5">
                      <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-4">Previous Period</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400 text-sm">Energy</span><span className="font-bold text-gray-700 dark:text-gray-300">{compData.previous.kwh} kWh</span></div>
                        <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400 text-sm">CO₂</span><span className="font-bold text-green-600 dark:text-green-400">{compData.previous.co2_kg} kg</span></div>
                        <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400 text-sm">Est. Cost</span><span className="font-bold text-purple-600 dark:text-purple-400">Rs. {compData.previous.cost}</span></div>
                        <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400 text-sm">Readings</span><span className="font-bold text-gray-700 dark:text-gray-300">{compData.previous.count}</span></div>
                      </div>
                    </div>
                  </div>

                  {/* Delta card */}
                  <div className={`rounded-xl p-4 border text-center ${
                    compData.change_kwh > 0 ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700' : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700'
                  }`}>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-1">Change</p>
                    <p className={`text-3xl font-bold ${compData.change_kwh > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                      {compData.change_kwh > 0 ? '+' : ''}{compData.change_kwh} kWh
                    </p>
                    {compData.change_pct !== null && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{compData.change_kwh > 0 ? '+' : ''}{compData.change_pct}% change</p>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* ──────── RECOMMENDATIONS ──────── */}
        {activeSection === 'recs' && !loading && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow border border-gray-100 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">💡 Smart Recommendations</h2>
                <button onClick={loadRecs} className="text-sm text-primary font-medium hover:underline">Refresh</button>
              </div>
              {recData && (
                <>
                  {/* Stats bar */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                    <StatCard icon="📊" label="Avg Reading" value={`${recData.stats.average} kWh`} color="blue" />
                    <StatCard icon="⚡" label="Peak" value={`${recData.stats.peak} kWh`} color="red" />
                    <StatCard icon="🕐" label="Recent Avg" value={`${recData.stats.recent_average} kWh`} color="yellow" />
                    <StatCard icon="📋" label="Records Analysed" value={recData.stats.total_records} color="purple" />
                  </div>
                  {/* Recommendation cards */}
                  <div className="space-y-4">
                    {recData.recommendations.map(rec => {
                      const color = recColors[rec.type] || 'blue';
                      const colors = {
                        green:  'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700',
                        blue:   'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700',
                        purple: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-700',
                        red:    'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700',
                        yellow: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700',
                      };
                      const titleColors = {
                        green: 'text-green-800 dark:text-green-300', blue: 'text-blue-800 dark:text-blue-300',
                        purple: 'text-purple-800 dark:text-purple-300', red: 'text-red-800 dark:text-red-300',
                        yellow: 'text-yellow-800 dark:text-yellow-300',
                      };
                      return (
                        <div key={rec.id} className={`flex items-start space-x-4 rounded-xl border p-5 ${colors[color]}`}>
                          <span className="text-3xl flex-shrink-0">{rec.icon}</span>
                          <div>
                            <h3 className={`font-bold text-sm mb-1 ${titleColors[color]}`}>{rec.title}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{rec.message}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* ──────── PDF REPORT ──────── */}
        {activeSection === 'pdf' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow border border-gray-100 dark:border-gray-700 p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">📄 Monthly PDF Report Export</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
                Download a full monthly energy report including consumption table, totals, CO₂ and cost breakdown.
              </p>

              {/* Month / Year picker */}
              <div className="max-w-sm bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Month</label>
                    <select
                      value={pdfMonth}
                      onChange={e => setPdfMonth(parseInt(e.target.value))}
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      {MONTH_NAMES.map((m, i) => (
                        <option key={i + 1} value={i + 1}>{m}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Year</label>
                    <select
                      value={pdfYear}
                      onChange={e => setPdfYear(parseInt(e.target.value))}
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                  <button
                    onClick={handleDownloadPdf}
                    disabled={pdfLoading}
                    className="w-full flex items-center justify-center space-x-3 px-6 py-3 bg-gradient-to-r from-primary to-secondary hover:from-primary-dark hover:to-secondary-dark text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-50"
                  >
                    {pdfLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>Generating PDF…</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                        </svg>
                        <span>Download {MONTH_NAMES[pdfMonth - 1]} {pdfYear} Report</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* What's included */}
              <div className="mt-8">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">📋 Report includes:</h3>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  {[
                    'Summary: Total kWh, CO₂ emissions, estimated cost, peak reading',
                    'Full meter-by-meter reading table with dates and period types',
                    'Per-reading CO₂ and cost breakdown',
                    'CO₂ factor and tariff rate used',
                    'Date & time of report generation'
                  ].map((item, i) => (
                    <li key={i} className="flex items-center space-x-2">
                      <span className="w-4 h-4 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-600 text-xs">✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default EnergyAnalytics;
