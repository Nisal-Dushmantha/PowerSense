const PDFDocument = require('pdfkit');
const { Parser } = require('json2csv');
const RenewableSource = require('../models/RenewableSource');
const RenewableEnergyRecord = require('../models/RenewableEnergyRecord');
const mongoose = require('mongoose');

// Add simple header to PDF
const addPDFHeader = (doc, title) => {
  doc.fontSize(18)
     .fillColor('#000000')
     .text(title, { align: 'center' });
  
  doc.fontSize(8)
     .fillColor('#666666')
     .text(`Report Date: ${new Date().toLocaleDateString()}`, { align: 'center' })
     .moveDown();
};

// Add footer
const addPDFFooter = (doc) => {
  doc.fontSize(7)
     .fillColor('#999999')
     .text(
       'PowerSense Energy Report',
       50,
       doc.page.height - 30,
       { align: 'center' }
     );
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

    // Period
    doc.fontSize(9).fillColor('#333333');
    if (startDate || endDate) {
      const start = startDate ? new Date(startDate).toLocaleDateString() : 'Beginning';
      const end = endDate ? new Date(endDate).toLocaleDateString() : 'Present';
      doc.text(`Period: ${start} to ${end}`, { align: 'center' });
    } else {
      doc.text('Period: All Time', { align: 'center' });
    }
    doc.moveDown(0.5);

    // Summary in compact format
    doc.fontSize(11).fillColor('#000000').text('Summary', { underline: true });
    doc.moveDown(0.3);
    
    doc.fontSize(9).fillColor('#333333');
    doc.text(`Total Records: ${records.length}`);
    doc.text(`Energy Generated: ${totalEnergy.toFixed(2)} kWh`);
    doc.text(`Carbon Offset: ${totalCarbonOffset.toFixed(2)} kg CO₂`);
    doc.text(`Cost Savings: Rs. ${totalCostSavings.toFixed(2)}`);
    doc.text(`Average Efficiency: ${avgEfficiency.toFixed(2)}%`);
    doc.moveDown(0.5);

    // Energy by Source Type
    if (Object.keys(sourceTypeStats).length > 0) {
      doc.fontSize(11).fillColor('#000000').text('Energy by Source Type', { underline: true });
      doc.moveDown(0.3);
      doc.fontSize(9).fillColor('#333333');

      Object.entries(sourceTypeStats).forEach(([type, stats]) => {
        const percentage = ((stats.energy / totalEnergy) * 100).toFixed(1);
        doc.text(`${type}: ${stats.energy.toFixed(2)} kWh (${percentage}%)`);
      });
      doc.moveDown(0.5);
    }

    // Recent entries (compact list)
    if (records.length > 0) {
      doc.fontSize(11).fillColor('#000000').text('Recent Entries', { underline: true });
      doc.moveDown(0.3);
      doc.fontSize(8).fillColor('#333333');

      const recentRecords = records.slice(0, 10);
      recentRecords.forEach((record, index) => {
        const date = new Date(record.recordDate).toLocaleDateString();
        const source = record.source?.sourceName || 'N/A';
        const energy = record.energyGenerated;
        doc.text(`${index + 1}. ${date} - ${source}: ${energy} kWh`);
      });

      if (records.length > 10) {
        doc.moveDown(0.3);
        doc.fontSize(8).fillColor('#666666')
           .text(`... and ${records.length - 10} more entries`);
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
    addPDFHeader(doc, 'Renewable Sources Report');

    // Summary
    doc.fontSize(9).fillColor('#333333');
    doc.text(`Total Sources: ${sources.length}`, { align: 'center' });
    const activeCount = sources.filter(s => s.status === 'Active').length;
    doc.text(`Active: ${activeCount}`, { align: 'center' });
    doc.moveDown(0.5);

    // Sources list
    doc.fontSize(11).fillColor('#000000').text('Source List', { underline: true });
    doc.moveDown(0.3);

    sourcesWithStats.forEach((source, index) => {
      doc.fontSize(9).fillColor('#000000')
         .text(`${index + 1}. ${source.sourceName} (${source.sourceType})`);
      
      doc.fontSize(8).fillColor('#333333');
      doc.text(`   Capacity: ${source.capacity} ${source.capacityUnit || 'kW'} | Status: ${source.status}`);
      doc.text(`   Installed: ${new Date(source.installationDate).toLocaleDateString()}`);
      doc.text(`   Energy: ${source.stats.totalEnergy.toFixed(2)} kWh | Records: ${source.stats.totalRecords}`);
      doc.moveDown(0.3);
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
    addPDFHeader(doc, 'Energy Summary Report');

    // Period
    doc.fontSize(9).fillColor('#333333');
    if (startDate || endDate) {
      const start = startDate ? new Date(startDate).toLocaleDateString() : 'Beginning';
      const end = endDate ? new Date(endDate).toLocaleDateString() : 'Present';
      doc.text(`Period: ${start} to ${end}`, { align: 'center' });
    } else {
      doc.text('Period: All Time', { align: 'center' });
    }
    doc.moveDown(0.5);

    // Overall stats
    doc.fontSize(11).fillColor('#000000').text('Overall Statistics', { underline: true });
    doc.moveDown(0.3);
    
    doc.fontSize(9).fillColor('#333333');
    doc.text(`Total Sources: ${sources.length} (${activeSources} active)`);
    doc.text(`Total Records: ${records.length}`);
    doc.text(`Energy Generated: ${totalEnergy.toFixed(2)} kWh`);
    doc.text(`Carbon Offset: ${totalCarbonOffset.toFixed(2)} kg CO₂`);
    doc.text(`Cost Savings: Rs. ${totalCostSavings.toFixed(2)}`);
    doc.text(`Average Efficiency: ${avgEfficiency.toFixed(2)}%`);
    doc.moveDown(0.5);

    // Energy by type
    if (Object.keys(energyByType).length > 0) {
      doc.fontSize(11).fillColor('#000000').text('Energy Distribution', { underline: true });
      doc.moveDown(0.3);
      doc.fontSize(9).fillColor('#333333');

      Object.entries(energyByType).forEach(([type, energy]) => {
        const percentage = ((energy / totalEnergy) * 100).toFixed(1);
        doc.text(`${type}: ${energy.toFixed(2)} kWh (${percentage}%)`);
      });
      doc.moveDown(0.5);
    }

    // Sources breakdown
    doc.fontSize(11).fillColor('#000000').text('Installed Sources', { underline: true });
    doc.moveDown(0.3);
    
    const sourcesByType = {};
    sources.forEach(source => {
      sourcesByType[source.sourceType] = (sourcesByType[source.sourceType] || 0) + 1;
    });

    doc.fontSize(9).fillColor('#333333');
    Object.entries(sourcesByType).forEach(([type, count]) => {
      const totalCapacity = sources
        .filter(s => s.sourceType === type)
        .reduce((sum, s) => sum + (s.capacity || 0), 0);
      
      doc.text(`${type}: ${count} sources (${totalCapacity.toFixed(2)} kW)`);
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
