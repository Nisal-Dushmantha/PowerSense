import React, { useState, useEffect } from 'react';
import { Table, Button, Space, DatePicker, Select, Input, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { getEnergyRecords, deleteEnergyRecord } from '../../services/energyApi';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
const { Option } = Select;

const ConsumptionList = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [filters, setFilters] = useState({
    period_type: '',
    dateRange: [],
    search: '',
  });

  const fetchRecords = async (params = {}) => {
    setLoading(true);
    try {
      const { current, pageSize, ...filters } = params;
      const queryParams = {
        page: current,
        limit: pageSize,
        ...filters,
      };
      
      if (filters.dateRange && filters.dateRange.length === 2) {
        queryParams.startDate = filters.dateRange[0].format('YYYY-MM-DD');
        queryParams.endDate = filters.dateRange[1].format('YYYY-MM-DD');
      }

      const response = await getEnergyRecords(queryParams);
      setRecords(response.data);
      setPagination({
        ...pagination,
        total: response.total,
        current: response.page,
        pageSize: response.limit,
      });
    } catch (error) {
      message.error('Failed to fetch energy consumption records');
      console.error('Error fetching records:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords({ ...pagination, ...filters });
  }, [pagination.current, pagination.pageSize, filters]);

  const handleTableChange = (pagination, filters, sorter) => {
    setPagination({
      ...pagination,
      sortField: sorter.field,
      sortOrder: sorter.order,
    });
  };

  const handleDelete = async (id) => {
    try {
      await deleteEnergyRecord(id);
      message.success('Record deleted successfully');
      fetchRecords({ ...pagination, ...filters });
    } catch (error) {
      message.error('Failed to delete record');
      console.error('Error deleting record:', error);
    }
  };

  const columns = [
    {
      title: 'Date',
      dataIndex: 'consumption_date',
      key: 'date',
      render: (date) => dayjs(date).format('YYYY-MM-DD'),
      sorter: true,
    },
    {
      title: 'Time',
      dataIndex: 'consumption_time',
      key: 'time',
    },
    {
      title: 'Energy (kWh)',
      dataIndex: 'energy_used_kwh',
      key: 'energy',
      sorter: true,
    },
    {
      title: 'Period Type',
      dataIndex: 'period_type',
      key: 'period_type',
      filters: [
        { text: 'Hourly', value: 'hourly' },
        { text: 'Daily', value: 'daily' },
        { text: 'Monthly', value: 'monthly' },
      ],
      onFilter: (value, record) => record.period_type === value,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="middle">
          <Link to={`/energy-consumption/edit/${record._id}`}>
            <Button type="link" icon={<EditOutlined />} />
          </Link>
          <Button 
            type="text" 
            danger 
            icon={<DeleteOutlined />} 
            onClick={() => handleDelete(record._id)}
          />
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Space>
          <RangePicker
            onChange={(dates) => setFilters({ ...filters, dateRange: dates })}
            style={{ width: 250 }}
          />
          <Select
            placeholder="Filter by period type"
            style={{ width: 200 }}
            allowClear
            onChange={(value) => setFilters({ ...filters, period_type: value })}
          >
            <Option value="hourly">Hourly</Option>
            <Option value="daily">Daily</Option>
            <Option value="monthly">Monthly</Option>
          </Select>
          <Input
            placeholder="Search..."
            prefix={<SearchOutlined />}
            style={{ width: 200 }}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
          <Link to="/energy-consumption/new">
            <Button type="primary" icon={<PlusOutlined />}>
              Add Record
            </Button>
          </Link>
        </Space>
      </div>
      
      <Table
        columns={columns}
        dataSource={records}
        rowKey="_id"
        loading={loading}
        pagination={{
          ...pagination,
          showSizeChanger: true,
          pageSizeOptions: ['10', '20', '50'],
          showTotal: (total) => `Total ${total} records`,
        }}
        onChange={handleTableChange}
      />
    </div>
  );
};

export default ConsumptionList;
