const PDFDocument = require('pdfkit');
const { Parser } = require('json2csv');
const RenewableSource = require('../models/RenewableSource');
const RenewableEnergyRecord = require('../models/RenewableEnergyRecord');
const mongoose = require('mongoose');

// Helper function to add header to PDF
const addPDFHeader = (doc, title) => {
  doc.fontSize(24)
     .fillColor('#2563eb')
     .text(title, { align: 'center' })
     .moveDown();
  
  doc.fontSize(10)
     .fillColor('#6b7280')
     .text(`Generated on: ${new Date().toLocaleDateString('en-US', { 
       year: 'numeric', 
       month: 'long', 
       day: 'numeric',
       hour: '2-digit',
       minute: '2-digit'
     })}`, { align: 'center' })
     .moveDown(2);
  
  doc.strokeColor('#e5e7eb')
     .lineWidth(1)
     .moveTo(50, doc.y)
     .lineTo(550, doc.y)
     .stroke()
     .moveDown();
};

// Helper function to add footer to PDF
const addPDFFooter = (doc) => {
  const pageCount = doc.bufferedPageRange().count;
  
  for (let i = 0; i < pageCount; i++) {
    doc.switchToPage(i);
    doc.fontSize(8)
       .fillColor('#9ca3af')
       .text(
         `PowerSense - Renewable Energy Management | Page ${i + 1} of ${pageCount}`,
         50,
         doc.page.height - 50,
         { align: 'center' }
       );
  }
};

// @desc    Generate comprehensive PDF report for energy records
// @route   GET /api/renewable/reports/pdf
// @access  Private
const generatePDFReport = async (req, res) => {
  try {
    const { startDate, endDate, sourceId, reportType = 'comprehensive' } = req.query;
    const userId = req.user._id;

    // Build query
    const query = { user: userId };
    if (sourceId && mongoose.Types.ObjectId.isValid(sourceId)) {
      query.source = new mongoose.Types.ObjectId(sourceId);
    }
    if (startDate || endDate) {
      query.recordDate = {};
      if (startDate) query.recordDate.$gte = new Date(startDate);
      if (endDate) query.recordDate.$lte = new Date(endDate);
    }

    // Fetch records and statistics
    const records = await RenewableEnergyRecord.find(query)
      .populate('source', 'sourceName sourceType capacity capacityUnit location')
      .sort('-recordDate');

    if (records.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No records found for the specified criteria'
      });
    }

    // Calculate statistics
    const totalEnergy = records.reduce((sum, r) => sum + (r.energyGenerated || 0), 0);
    const totalCarbonOffset = records.reduce((sum, r) => sum + (r.carbonOffset || 0), 0);
    const totalCostSavings = records.reduce((sum, r) => sum + (r.costSavings || 0), 0);
    const avgEfficiency = records.reduce((sum, r) => sum + (r.efficiency || 0), 0) / records.length;

    // Group by source type
    const sourceTypeStats = {};
    records.forEach(record => {
      const type = record.source?.sourceType || 'Unknown';
      if (!sourceTypeStats[type]) {
        sourceTypeStats[type] = { energy: 0, count: 0 };
      }
      sourceTypeStats[type].energy += record.energyGenerated || 0;
      sourceTypeStats[type].count += 1;
    });

    // Create PDF document
    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=renewable-energy-report-${Date.now()}.pdf`);

    // Pipe PDF to response
    doc.pipe(res);

    // Add header
    addPDFHeader(doc, 'Renewable Energy Report');

    // Report Period
    doc.fontSize(12).fillColor('#374151').text('Report Period:', { underline: true });
    doc.fontSize(10).fillColor('#6b7280');
    if (startDate || endDate) {
      const start = startDate ? new Date(startDate).toLocaleDateString() : 'Beginning';
      const end = endDate ? new Date(endDate).toLocaleDateString() : 'Present';
      doc.text(`${start} to ${end}`);
    } else {
      doc.text('All Time');
    }
    doc.moveDown();

    // Summary Statistics
    doc.fontSize(14).fillColor('#1f2937').text('Summary Statistics', { underline: true });
    doc.moveDown(0.5);
    
    const summaryData = [
      ['Total Records:', records.length],
      ['Total Energy Generated:', `${totalEnergy.toFixed(2)} kWh`],
      ['Total Carbon Offset:', `${totalCarbonOffset.toFixed(2)} kg CO₂`],
      ['Total Cost Savings:', `Rs. ${totalCostSavings.toFixed(2)}`],
      ['Average Efficiency:', `${avgEfficiency.toFixed(2)}%`]
    ];

    doc.fontSize(10).fillColor('#374151');
    summaryData.forEach(([label, value]) => {
      doc.text(label, 60, doc.y, { continued: true, width: 250 })
         .fillColor('#2563eb')
         .text(value, { align: 'right' })
         .fillColor('#374151');
    });
    doc.moveDown(2);

    // Energy by Source Type
    if (Object.keys(sourceTypeStats).length > 0) {
      doc.fontSize(14).fillColor('#1f2937').text('Energy Generation by Source Type', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(10).fillColor('#374151');

      Object.entries(sourceTypeStats).forEach(([type, stats]) => {
        const percentage = ((stats.energy / totalEnergy) * 100).toFixed(1);
        doc.text(`${type}:`, 60, doc.y, { continued: true, width: 200 })
           .fillColor('#2563eb')
           .text(`${stats.energy.toFixed(2)} kWh (${percentage}%)`, { align: 'right' })
           .fillColor('#374151');
      });
      doc.moveDown(2);
    }

    // Detailed Records
    if (reportType === 'comprehensive' || reportType === 'detailed') {
      doc.addPage();
      doc.fontSize(14).fillColor('#1f2937').text('Detailed Energy Records', { underline: true });
      doc.moveDown();

      records.slice(0, 50).forEach((record, index) => {
        if (doc.y > 700) {
          doc.addPage();
        }

        doc.fontSize(11).fillColor('#1f2937')
           .text(`${index + 1}. ${record.source?.sourceName || 'N/A'} (${record.source?.sourceType || 'N/A'})`);
        
        doc.fontSize(9).fillColor('#6b7280');
        doc.text(`Date: ${new Date(record.recordDate).toLocaleDateString()}`, 70);
        doc.text(`Energy: ${record.energyGenerated} ${record.energyUnit || 'kWh'} | Efficiency: ${record.efficiency || 'N/A'}%`, 70);
        if (record.weatherCondition) {
          doc.text(`Weather: ${record.weatherCondition}`, 70);
        }
        if (record.costSavings) {
          doc.text(`Cost Savings: Rs. ${record.costSavings.toFixed(2)}`, 70);
        }
        doc.moveDown(0.8);
      });

      if (records.length > 50) {
        doc.fontSize(9).fillColor('#9ca3af')
           .text(`... and ${records.length - 50} more records`, { align: 'center' });
      }
    }

    // Add footer
    addPDFFooter(doc);

    // Finalize PDF
    doc.end();

  } catch (error) {
    console.error('Error generating PDF report:', error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Error generating PDF report',
        error: error.message
      });
    }
  }
};

// @desc    Generate CSV export for energy records
// @route   GET /api/renewable/reports/csv
// @access  Private
const generateCSVReport = async (req, res) => {
  try {
    const { startDate, endDate, sourceId } = req.query;
    const userId = req.user._id;

    // Build query
    const query = { user: userId };
    if (sourceId && mongoose.Types.ObjectId.isValid(sourceId)) {
      query.source = new mongoose.Types.ObjectId(sourceId);
    }
    if (startDate || endDate) {
      query.recordDate = {};
      if (startDate) query.recordDate.$gte = new Date(startDate);
      if (endDate) query.recordDate.$lte = new Date(endDate);
    }

    // Fetch records
    const records = await RenewableEnergyRecord.find(query)
      .populate('source', 'sourceName sourceType capacity capacityUnit location')
      .sort('-recordDate');

    if (records.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No records found for the specified criteria'
      });
    }

    // Format data for CSV
    const csvData = records.map(record => ({
      'Record Date': new Date(record.recordDate).toLocaleDateString(),
      'Source Name': record.source?.sourceName || 'N/A',
      'Source Type': record.source?.sourceType || 'N/A',
      'Energy Generated': record.energyGenerated,
      'Energy Unit': record.energyUnit || 'kWh',
      'Peak Power': record.peakPower || 'N/A',
      'Average Power': record.averagePower || 'N/A',
      'Operating Hours': record.operatingHours || 'N/A',
      'Efficiency (%)': record.efficiency || 'N/A',
      'Weather Condition': record.weatherCondition || 'N/A',
      'Temperature': record.temperature || 'N/A',
      'Carbon Offset (kg CO₂)': record.carbonOffset?.toFixed(2) || 'N/A',
      'Cost Savings (Rs.)': record.costSavings?.toFixed(2) || 'N/A',
      'Maintenance Performed': record.maintenancePerformed ? 'Yes' : 'No',
      'Notes': record.notes || ''
    }));

    // Define CSV fields
    const fields = [
      'Record Date',
      'Source Name',
      'Source Type',
      'Energy Generated',
      'Energy Unit',
      'Peak Power',
      'Average Power',
      'Operating Hours',
      'Efficiency (%)',
      'Weather Condition',
      'Temperature',
      'Carbon Offset (kg CO₂)',
      'Cost Savings (Rs.)',
      'Maintenance Performed',
      'Notes'
    ];

    // Create CSV parser
    const parser = new Parser({ fields });
    const csv = parser.parse(csvData);

    // Set response headers
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=renewable-energy-records-${Date.now()}.csv`);

    // Send CSV
    res.send(csv);

  } catch (error) {
    console.error('Error generating CSV report:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating CSV report',
      error: error.message
    });
  }
};

// @desc    Generate sources PDF report
// @route   GET /api/renewable/reports/sources/pdf
// @access  Private
const generateSourcesPDFReport = async (req, res) => {
  try {
    const userId = req.user._id;
    const { status, sourceType } = req.query;

    // Build query
    const query = { user: userId };
    if (status) query.status = status;
    if (sourceType) query.sourceType = sourceType;

    // Fetch sources
    const sources = await RenewableSource.find(query).sort('sourceName');

    if (sources.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No sources found'
      });
    }

    // Get statistics for each source
    const sourcesWithStats = await Promise.all(
      sources.map(async (source) => {
        const stats = await RenewableEnergyRecord.aggregate([
          { $match: { source: source._id } },
          {
            $group: {
              _id: null,
              totalEnergy: { $sum: '$energyGenerated' },
              totalRecords: { $sum: 1 },
              avgEfficiency: { $avg: '$efficiency' }
            }
          }
        ]);

        return {
          ...source.toObject(),
          stats: stats[0] || { totalEnergy: 0, totalRecords: 0, avgEfficiency: 0 }
        };
      })
    );

    // Create PDF document
    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=renewable-sources-report-${Date.now()}.pdf`);

    // Pipe PDF to response
    doc.pipe(res);

    // Add header
    addPDFHeader(doc, 'Renewable Energy Sources Report');

    // Summary
    doc.fontSize(12).fillColor('#374151').text('Summary:', { underline: true });
    doc.fontSize(10).fillColor('#6b7280');
    doc.text(`Total Sources: ${sources.length}`);
    const activeCount = sources.filter(s => s.status === 'Active').length;
    doc.text(`Active Sources: ${activeCount}`);
    doc.moveDown(2);

    // Sources Details
    doc.fontSize(14).fillColor('#1f2937').text('Source Details', { underline: true });
    doc.moveDown();

    sourcesWithStats.forEach((source, index) => {
      if (doc.y > 650) {
        doc.addPage();
      }

      // Source header
      doc.fontSize(12).fillColor('#2563eb')
         .text(`${index + 1}. ${source.sourceName}`, { underline: true });
      
      doc.fontSize(10).fillColor('#374151');
      doc.text(`Type: ${source.sourceType}`, 60);
      doc.text(`Capacity: ${source.capacity} ${source.capacityUnit || 'kW'}`, 60);
      doc.text(`Status: ${source.status}`, 60);
      doc.text(`Installation Date: ${new Date(source.installationDate).toLocaleDateString()}`, 60);
      
      if (source.location) {
        doc.text(`Location: ${source.location}`, 60);
      }

      // Statistics
      doc.fillColor('#6b7280');
      doc.text(`Total Energy Generated: ${source.stats.totalEnergy.toFixed(2)} kWh`, 60);
      doc.text(`Total Records: ${source.stats.totalRecords}`, 60);
      if (source.stats.avgEfficiency > 0) {
        doc.text(`Average Efficiency: ${source.stats.avgEfficiency.toFixed(2)}%`, 60);
      }

      doc.moveDown(1.5);
    });

    // Add footer
    addPDFFooter(doc);

    // Finalize PDF
    doc.end();

  } catch (error) {
    console.error('Error generating sources PDF report:', error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Error generating sources PDF report',
        error: error.message
      });
    }
  }
};

// @desc    Generate sources CSV export
// @route   GET /api/renewable/reports/sources/csv
// @access  Private
const generateSourcesCSVReport = async (req, res) => {
  try {
    const userId = req.user._id;
    const { status, sourceType } = req.query;

    // Build query
    const query = { user: userId };
    if (status) query.status = status;
    if (sourceType) query.sourceType = sourceType;

    // Fetch sources
    const sources = await RenewableSource.find(query).sort('sourceName');

    if (sources.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No sources found'
      });
    }

    // Format data for CSV
    const csvData = sources.map(source => ({
      'Source Name': source.sourceName,
      'Source Type': source.sourceType,
      'Capacity': source.capacity,
      'Capacity Unit': source.capacityUnit || 'kW',
      'Installation Date': new Date(source.installationDate).toLocaleDateString(),
      'Location': source.location || 'N/A',
      'Status': source.status,
      'Manufacturer': source.manufacturer || 'N/A',
      'Warranty Expiry': source.warrantyExpiry ? new Date(source.warrantyExpiry).toLocaleDateString() : 'N/A',
      'Estimated Annual Production': source.estimatedAnnualProduction || 'N/A',
      'Description': source.description || ''
    }));

    // Define CSV fields
    const fields = [
      'Source Name',
      'Source Type',
      'Capacity',
      'Capacity Unit',
      'Installation Date',
      'Location',
      'Status',
      'Manufacturer',
      'Warranty Expiry',
      'Estimated Annual Production',
      'Description'
    ];

    // Create CSV parser
    const parser = new Parser({ fields });
    const csv = parser.parse(csvData);

    // Set response headers
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=renewable-sources-${Date.now()}.csv`);

    // Send CSV
    res.send(csv);

  } catch (error) {
    console.error('Error generating sources CSV report:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating sources CSV report',
      error: error.message
    });
  }
};

// @desc    Generate combined summary report (PDF)
// @route   GET /api/renewable/reports/summary/pdf
// @access  Private
const generateSummaryPDFReport = async (req, res) => {
  try {
    const userId = req.user._id;
    const { startDate, endDate } = req.query;

    // Fetch sources
    const sources = await RenewableSource.find({ user: userId });
    const activeSources = sources.filter(s => s.status === 'Active').length;

    // Build query for records
    const query = { user: userId };
    if (startDate || endDate) {
      query.recordDate = {};
      if (startDate) query.recordDate.$gte = new Date(startDate);
      if (endDate) query.recordDate.$lte = new Date(endDate);
    }

    // Fetch records and calculate statistics
    const records = await RenewableEnergyRecord.find(query).populate('source');
    
    const totalEnergy = records.reduce((sum, r) => sum + (r.energyGenerated || 0), 0);
    const totalCarbonOffset = records.reduce((sum, r) => sum + (r.carbonOffset || 0), 0);
    const totalCostSavings = records.reduce((sum, r) => sum + (r.costSavings || 0), 0);
    const avgEfficiency = records.length > 0 
      ? records.reduce((sum, r) => sum + (r.efficiency || 0), 0) / records.length 
      : 0;

    // Energy by source type
    const energyByType = {};
    records.forEach(record => {
      const type = record.source?.sourceType || 'Unknown';
      energyByType[type] = (energyByType[type] || 0) + (record.energyGenerated || 0);
    });

    // Create PDF document
    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=renewable-summary-report-${Date.now()}.pdf`);

    // Pipe PDF to response
    doc.pipe(res);

    // Add header
    addPDFHeader(doc, 'Renewable Energy Summary Report');

    // Report Period
    doc.fontSize(12).fillColor('#374151').text('Report Period:', { underline: true });
    doc.fontSize(10).fillColor('#6b7280');
    if (startDate || endDate) {
      const start = startDate ? new Date(startDate).toLocaleDateString() : 'Beginning';
      const end = endDate ? new Date(endDate).toLocaleDateString() : 'Present';
      doc.text(`${start} to ${end}`);
    } else {
      doc.text('All Time');
    }
    doc.moveDown(2);

    // Overall Statistics
    doc.fontSize(16).fillColor('#1f2937').text('Overall Statistics', { underline: true });
    doc.moveDown();

    const overallStats = [
      ['Total Sources:', sources.length],
      ['Active Sources:', activeSources],
      ['Total Energy Records:', records.length],
      ['Total Energy Generated:', `${totalEnergy.toFixed(2)} kWh`],
      ['Total Carbon Offset:', `${totalCarbonOffset.toFixed(2)} kg CO₂`],
      ['Total Cost Savings:', `Rs. ${totalCostSavings.toFixed(2)}`],
      ['Average Efficiency:', `${avgEfficiency.toFixed(2)}%`]
    ];

    doc.fontSize(11).fillColor('#374151');
    overallStats.forEach(([label, value]) => {
      doc.text(label, 60, doc.y, { continued: true, width: 300 })
         .fillColor('#2563eb')
         .text(String(value), { align: 'right' })
         .fillColor('#374151');
    });
    doc.moveDown(2);

    // Energy Distribution
    if (Object.keys(energyByType).length > 0) {
      doc.fontSize(14).fillColor('#1f2937').text('Energy Distribution by Type', { underline: true });
      doc.moveDown();
      doc.fontSize(10).fillColor('#374151');

      Object.entries(energyByType).forEach(([type, energy]) => {
        const percentage = ((energy / totalEnergy) * 100).toFixed(1);
        doc.text(`${type}:`, 60, doc.y, { continued: true, width: 200 })
           .fillColor('#2563eb')
           .text(`${energy.toFixed(2)} kWh (${percentage}%)`, { align: 'right' })
           .fillColor('#374151');
      });
      doc.moveDown(2);
    }

    // Source Type Breakdown
    doc.fontSize(14).fillColor('#1f2937').text('Installed Sources by Type', { underline: true });
    doc.moveDown();
    
    const sourcesByType = {};
    sources.forEach(source => {
      sourcesByType[source.sourceType] = (sourcesByType[source.sourceType] || 0) + 1;
    });

    doc.fontSize(10).fillColor('#374151');
    Object.entries(sourcesByType).forEach(([type, count]) => {
      const totalCapacity = sources
        .filter(s => s.sourceType === type)
        .reduce((sum, s) => sum + (s.capacity || 0), 0);
      
      doc.text(`${type}:`, 60, doc.y, { continued: true, width: 200 })
         .fillColor('#2563eb')
         .text(`${count} sources (${totalCapacity.toFixed(2)} kW)`, { align: 'right' })
         .fillColor('#374151');
    });

    // Add footer
    addPDFFooter(doc);

    // Finalize PDF
    doc.end();

  } catch (error) {
    console.error('Error generating summary PDF report:', error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Error generating summary PDF report',
        error: error.message
      });
    }
  }
};

module.exports = {
  generatePDFReport,
  generateCSVReport,
  generateSourcesPDFReport,
  generateSourcesCSVReport,
  generateSummaryPDFReport
};
