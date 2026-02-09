import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, DatePicker, Select, message } from 'antd';
import { getTotalConsumption } from '../../services/energyApi';
import { Line } from '@ant-design/charts';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
const { Option } = Select;

const ConsumptionStats = () => {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalConsumption: 0,
    averageDaily: 0,
    data: [],
  });
  const [filters, setFilters] = useState({
    dateRange: [dayjs().subtract(30, 'days'), dayjs()],
    period: 'daily',
  });

  const fetchStats = async () => {
    if (!filters.dateRange || filters.dateRange.length !== 2) return;

    setLoading(true);
    try {
      const params = {
        startDate: filters.dateRange[0].format('YYYY-MM-DD'),
        endDate: filters.dateRange[1].format('YYYY-MM-DD'),
        period: filters.period,
      };

      const response = await getTotalConsumption(params);
      setStats({
        totalConsumption: response.total_consumption || 0,
        averageDaily: response.average_daily || 0,
        data: response.data || [],
      });
    } catch (error) {
      message.error('Failed to load consumption statistics');
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [filters]);

  const chartData = stats.data.map(item => ({
    date: item._id,
    value: item.total_energy_used,
  }));

  const config = {
    data: chartData,
    xField: 'date',
    yField: 'value',
    point: {
      size: 5,
      shape: 'diamond',
    },
    label: {},
    state: {
      active: {
        style: {
          shadowBlur: 4,
          stroke: '#000',
          fill: 'red',
        },
      },
    },
    interactions: [{ type: 'marker-active' }],
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Row gutter={16}>
          <Col span={12}>
            <RangePicker
              value={filters.dateRange}
              onChange={(dates) => setFilters({ ...filters, dateRange: dates })}
              style={{ width: '100%' }}
            />
          </Col>
          <Col span={6}>
            <Select
              value={filters.period}
              onChange={(value) => setFilters({ ...filters, period: value })}
              style={{ width: '100%' }}
            >
              <Option value="daily">Daily</Option>
              <Option value="weekly">Weekly</Option>
              <Option value="monthly">Monthly</Option>
            </Select>
          </Col>
        </Row>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={8}>
          <Card>
            <Statistic
              title="Total Consumption (kWh)"
              value={stats.totalConsumption}
              precision={2}
              loading={loading}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card>
            <Statistic
              title={`Average ${filters.period === 'daily' ? 'Daily' : filters.period === 'weekly' ? 'Weekly' : 'Monthly'} Usage (kWh)`}
              value={stats.averageDaily}
              precision={2}
              loading={loading}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card>
            <Statistic
              title="Total Records"
              value={stats.data.length}
              loading={loading}
            />
          </Card>
        </Col>
      </Row>

      <Card title="Energy Consumption Trend" loading={loading}>
        <Line {...config} />
      </Card>
    </div>
  );
};

export default ConsumptionStats;
