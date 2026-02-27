const EnergyConsumption = require('../models/energyConsumption');
const User = require('../models/User');
const PDFDocument = require('pdfkit');

const CO2_FACTOR = 0.527; // kg CO2 per kWh (Sri Lanka grid average)
const TARIFF_RATE = 35;   // Rs. per kWh (CEB residential approximate)

// ─────────────────────────────────────────────
// @desc   Get top peak usage records
// @route  GET /api/energy-analytics/peak
// @access Private
// ─────────────────────────────────────────────
exports.getPeakUsage = async (req, res) => {
    try {
        const { limit = 10, period_type } = req.query;
        const query = { user: req.user.id };
        if (period_type) query.period_type = period_type;

        const records = await EnergyConsumption.find(query)
            .sort({ energy_used_kwh: -1 })
            .limit(parseInt(limit))
            .select('meter_id consumption_date energy_used_kwh period_type');

        const average = records.length
            ? records.reduce((s, r) => s + r.energy_used_kwh, 0) / records.length
            : 0;

        res.json({
            success: true,
            data: {
                records: records.map(r => ({
                    meter_id: r.meter_id,
                    date: r.consumption_date,
                    energy_used_kwh: r.energy_used_kwh,
                    period_type: r.period_type,
                    co2_kg: (r.energy_used_kwh * CO2_FACTOR).toFixed(2)
                })),
                peak: records[0]?.energy_used_kwh || 0,
                average: parseFloat(average.toFixed(2))
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─────────────────────────────────────────────
// @desc   Get records exceeding user threshold
// @route  GET /api/energy-analytics/alerts
// @access Private
// ─────────────────────────────────────────────
exports.getThresholdAlerts = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const threshold = user.energyThreshold;

        if (threshold === null || threshold === undefined) {
            return res.json({
                success: true,
                data: { threshold: null, alerts: [], count: 0, message: 'No threshold set' }
            });
        }

        const alerts = await EnergyConsumption.find({
            user: req.user.id,
            energy_used_kwh: { $gt: threshold }
        })
            .sort({ consumption_date: -1 })
            .select('meter_id consumption_date energy_used_kwh period_type');

        res.json({
            success: true,
            data: {
                threshold,
                count: alerts.length,
                alerts: alerts.map(r => ({
                    meter_id: r.meter_id,
                    date: r.consumption_date,
                    energy_used_kwh: r.energy_used_kwh,
                    period_type: r.period_type,
                    exceeded_by: parseFloat((r.energy_used_kwh - threshold).toFixed(2))
                }))
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─────────────────────────────────────────────
// @desc   Calculate carbon footprint
// @route  GET /api/energy-analytics/carbon
// @access Private
// ─────────────────────────────────────────────
exports.getCarbonFootprint = async (req, res) => {
    try {
        const { startDate, endDate, period_type } = req.query;
        const query = { user: req.user.id };
        if (period_type) query.period_type = period_type;
        if (startDate || endDate) {
            query.consumption_date = {};
            if (startDate) query.consumption_date.$gte = new Date(startDate);
            if (endDate)   query.consumption_date.$lte = new Date(endDate);
        }

        const result = await EnergyConsumption.aggregate([
            { $match: query },
            { $group: { _id: null, total_kwh: { $sum: '$energy_used_kwh' }, count: { $sum: 1 } } }
        ]);

        const total_kwh  = result[0]?.total_kwh  || 0;
        const count      = result[0]?.count       || 0;
        const co2_kg     = parseFloat((total_kwh * CO2_FACTOR).toFixed(2));
        const co2_tonnes = parseFloat((co2_kg / 1000).toFixed(4));

        // Monthly breakdown
        const monthly = await EnergyConsumption.aggregate([
            { $match: query },
            {
                $group: {
                    _id: { year: { $year: '$consumption_date' }, month: { $month: '$consumption_date' } },
                    total_kwh: { $sum: '$energy_used_kwh' }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } }
        ]);

        res.json({
            success: true,
            data: {
                total_kwh: parseFloat(total_kwh.toFixed(2)),
                co2_kg,
                co2_tonnes,
                count,
                co2_factor: CO2_FACTOR,
                monthly: monthly.map(m => ({
                    year: m._id.year,
                    month: m._id.month,
                    total_kwh: parseFloat(m.total_kwh.toFixed(2)),
                    co2_kg: parseFloat((m.total_kwh * CO2_FACTOR).toFixed(2))
                }))
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─────────────────────────────────────────────
// @desc   Compare two periods
// @route  GET /api/energy-analytics/comparison
// @access Private
// ─────────────────────────────────────────────
exports.getUsageComparison = async (req, res) => {
    try {
        const { currentStart, currentEnd, previousStart, previousEnd, period_type } = req.query;

        const buildQuery = (start, end) => {
            const q = { user: req.user.id };
            if (period_type) q.period_type = period_type;
            if (start || end) {
                q.consumption_date = {};
                if (start) q.consumption_date.$gte = new Date(start);
                if (end)   q.consumption_date.$lte = new Date(end);
            }
            return q;
        };

        const [curResult, prevResult] = await Promise.all([
            EnergyConsumption.aggregate([
                { $match: buildQuery(currentStart, currentEnd) },
                { $group: { _id: null, total: { $sum: '$energy_used_kwh' }, count: { $sum: 1 } } }
            ]),
            EnergyConsumption.aggregate([
                { $match: buildQuery(previousStart, previousEnd) },
                { $group: { _id: null, total: { $sum: '$energy_used_kwh' }, count: { $sum: 1 } } }
            ])
        ]);

        const current_kwh  = parseFloat((curResult[0]?.total  || 0).toFixed(2));
        const previous_kwh = parseFloat((prevResult[0]?.total || 0).toFixed(2));
        const change_kwh   = parseFloat((current_kwh - previous_kwh).toFixed(2));
        const change_pct   = previous_kwh > 0
            ? parseFloat(((change_kwh / previous_kwh) * 100).toFixed(1))
            : null;

        res.json({
            success: true,
            data: {
                current:  { kwh: current_kwh,  co2_kg: parseFloat((current_kwh  * CO2_FACTOR).toFixed(2)), cost: parseFloat((current_kwh  * TARIFF_RATE).toFixed(2)), count: curResult[0]?.count  || 0 },
                previous: { kwh: previous_kwh, co2_kg: parseFloat((previous_kwh * CO2_FACTOR).toFixed(2)), cost: parseFloat((previous_kwh * TARIFF_RATE).toFixed(2)), count: prevResult[0]?.count || 0 },
                change_kwh,
                change_pct,
                trend: change_pct === null ? 'no-data' : change_pct > 0 ? 'up' : change_pct < 0 ? 'down' : 'stable'
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─────────────────────────────────────────────
// @desc   Rule-based smart recommendations
// @route  GET /api/energy-analytics/recommendations
// @access Private
// ─────────────────────────────────────────────
exports.getRecommendations = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        const records = await EnergyConsumption.find({ user: req.user.id })
            .sort({ consumption_date: -1 })
            .limit(60);

        if (!records.length) {
            return res.json({ success: true, data: { recommendations: [{ id: 1, type: 'info', icon: '📊', title: 'No data yet', message: 'Add some energy readings to receive personalised recommendations.' }] } });
        }

        const values   = records.map(r => r.energy_used_kwh);
        const average  = values.reduce((s, v) => s + v, 0) / values.length;
        const peak     = Math.max(...values);
        const recent5  = values.slice(0, 5);
        const recent5avg = recent5.reduce((s, v) => s + v, 0) / recent5.length;
        const threshold = user.energyThreshold;

        const recs = [];

        if (peak > average * 2) {
            recs.push({ id: 1, type: 'warning', icon: '⚡', title: 'High Peak Detected', message: `Your peak usage (${peak.toFixed(1)} kWh) is more than 2× your average. Consider staggering high-load appliances.` });
        }
        if (recent5avg > average * 1.15) {
            recs.push({ id: 2, type: 'alert', icon: '📈', title: 'Rising Consumption', message: `Your last 5 readings average ${recent5avg.toFixed(1)} kWh — 15%+ above your overall average. Check for standby loads.` });
        }
        if (recent5avg < average * 0.85) {
            recs.push({ id: 3, type: 'success', icon: '✅', title: 'Consumption Improving', message: `Great work! Your recent usage is 15%+ below your average. Keep it up!` });
        }
        if (threshold && peak > threshold) {
            recs.push({ id: 4, type: 'alert', icon: '🔔', title: 'Threshold Exceeded', message: `${records.filter(r => r.energy_used_kwh > threshold).length} readings exceed your alert threshold of ${threshold} kWh.` });
        }
        if (average > 100) {
            recs.push({ id: 5, type: 'tip', icon: '💡', title: 'Switch to LED Lighting', message: 'High average usage detected. Replacing incandescent bulbs with LEDs can cut lighting energy by up to 80%.' });
        }
        if (average > 200) {
            recs.push({ id: 6, type: 'tip', icon: '🌡️', title: 'AC Efficiency', message: 'Very high usage observed. Setting your AC to 24–26 °C instead of 18–20 °C can reduce cooling costs by 30%.' });
        }
        const hourlyCnt = records.filter(r => r.period_type === 'hourly').length;
        if (hourlyCnt > records.length * 0.4) {
            recs.push({ id: 7, type: 'tip', icon: '🌙', title: 'Off-Peak Shifting', message: 'High hourly activity detected. Shifting heavy loads (washing machines, water heaters) to off-peak hours (10 PM–6 AM) lowers cost.' });
        }
        const co2Total = values.reduce((s, v) => s + v, 0) * CO2_FACTOR;
        if (co2Total > 500) {
            recs.push({ id: 8, type: 'info', icon: '🌿', title: 'Carbon Footprint', message: `Total CO₂ from your records: ${co2Total.toFixed(1)} kg. Consider renewable energy sources to offset this.` });
        }

        if (!recs.length) {
            recs.push({ id: 9, type: 'success', icon: '🏆', title: 'Looking Good!', message: 'Your energy consumption patterns are healthy. No major issues detected.' });
        }

        res.json({ success: true, data: { recommendations: recs, stats: { average: parseFloat(average.toFixed(2)), peak, recent_average: parseFloat(recent5avg.toFixed(2)), total_records: records.length } } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─────────────────────────────────────────────
// @desc   Download monthly PDF report
// @route  GET /api/energy-analytics/report/pdf
// @access Private
// ─────────────────────────────────────────────
exports.downloadMonthlyReport = async (req, res) => {
    try {
        const { month, year } = req.query;
        const user = await User.findById(req.user.id);

        const targetMonth = parseInt(month) || new Date().getMonth() + 1;
        const targetYear  = parseInt(year)  || new Date().getFullYear();

        const startDate = new Date(targetYear, targetMonth - 1, 1);
        const endDate   = new Date(targetYear, targetMonth, 0, 23, 59, 59);

        const records = await EnergyConsumption.find({
            user: req.user.id,
            consumption_date: { $gte: startDate, $lte: endDate }
        }).sort({ consumption_date: 1 });

        const totalKwh  = records.reduce((s, r) => s + r.energy_used_kwh, 0);
        const totalCo2  = totalKwh * CO2_FACTOR;
        const totalCost = totalKwh * TARIFF_RATE;
        const peak      = records.length ? Math.max(...records.map(r => r.energy_used_kwh)) : 0;
        const monthName = startDate.toLocaleString('default', { month: 'long' });

        // Build PDF
        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=PowerSense_Report_${monthName}_${targetYear}.pdf`);
        doc.pipe(res);

        // Header bar
        doc.rect(0, 0, 595, 80).fill('#16a34a');
        doc.fontSize(22).fillColor('#ffffff').font('Helvetica-Bold')
            .text('⚡ PowerSense Energy Report', 50, 25, { width: 495 });
        doc.fontSize(11).fillColor('#d1fae5')
            .text(`${monthName} ${targetYear}  |  ${user.firstName} ${user.lastName}`, 50, 52);
        doc.fillColor('#000000');

        // Summary cards row
        const cardY = 100;
        const cards = [
            { label: 'Total Consumption', value: `${totalKwh.toFixed(2)} kWh`, color: '#16a34a' },
            { label: 'Total CO₂',         value: `${totalCo2.toFixed(2)} kg`,  color: '#0891b2' },
            { label: 'Est. Cost',          value: `Rs. ${totalCost.toFixed(2)}`, color: '#7c3aed' },
            { label: 'Peak Reading',       value: `${peak.toFixed(2)} kWh`,     color: '#dc2626' }
        ];
        cards.forEach((c, i) => {
            const x = 50 + i * 125;
            doc.roundedRect(x, cardY, 115, 60, 6).fill('#f0fdf4').stroke('#d1fae5');
            doc.fontSize(8).fillColor('#6b7280').font('Helvetica').text(c.label, x + 8, cardY + 10, { width: 99 });
            doc.fontSize(11).fillColor(c.color).font('Helvetica-Bold').text(c.value, x + 8, cardY + 26, { width: 99 });
        });

        // Table header
        const tableTop = 180;
        doc.rect(50, tableTop, 495, 22).fill('#16a34a');
        const cols = [50, 95, 180, 270, 355, 430, 505];
        const headers = ['#', 'Meter ID', 'Date', 'kWh', 'Period', 'CO₂ (kg)', 'Cost (Rs.)'];
        headers.forEach((h, i) => {
            doc.fontSize(9).fillColor('#ffffff').font('Helvetica-Bold')
                .text(h, cols[i] + 2, tableTop + 7, { width: cols[i + 1] - cols[i] - 4 });
        });

        // Table rows
        doc.font('Helvetica').fillColor('#000000');
        records.forEach((r, idx) => {
            const rowY = tableTop + 22 + idx * 20;
            if (rowY > 740) return; // page overflow guard (simple)
            if (idx % 2 === 0) doc.rect(50, rowY, 495, 20).fill('#f9fafb');
            const row = [
                String(idx + 1),
                r.meter_id || '—',
                new Date(r.consumption_date).toLocaleDateString('en-GB'),
                r.energy_used_kwh.toFixed(2),
                r.period_type,
                (r.energy_used_kwh * CO2_FACTOR).toFixed(2),
                (r.energy_used_kwh * TARIFF_RATE).toFixed(2)
            ];
            row.forEach((cell, i) => {
                doc.fontSize(8).fillColor('#374151')
                    .text(cell, cols[i] + 2, rowY + 6, { width: cols[i + 1] - cols[i] - 4 });
            });
        });

        // Footer
        const footerY = Math.min(tableTop + 22 + records.length * 20 + 20, 760);
        doc.moveTo(50, footerY).lineTo(545, footerY).stroke('#e5e7eb');
        doc.fontSize(8).fillColor('#9ca3af').font('Helvetica')
            .text(`CO₂ factor: ${CO2_FACTOR} kg/kWh (Sri Lanka grid) | Tariff: Rs. ${TARIFF_RATE}/kWh | Generated: ${new Date().toLocaleString()}`, 50, footerY + 8, { width: 495, align: 'center' });

        doc.end();
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
