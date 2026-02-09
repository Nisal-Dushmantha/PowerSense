import React, { useState, useEffect } from 'react';
import { Form, Input, Button, DatePicker, TimePicker, Select, message, Card, Spin, Space } from 'antd';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { 
  createEnergyRecord, 
  updateEnergyRecord, 
  getEnergyRecords 
} from '../../services/energyApi';
import dayjs from 'dayjs';

const { Option } = Select;

const ConsumptionForm = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const navigate = useNavigate();
  const { id } = useParams();

  useEffect(() => {
    if (id) {
      setIsEditMode(true);
      fetchRecord(id);
    }
  }, [id]);

  const fetchRecord = async (recordId) => {
    setLoading(true);
    try {
      const response = await getEnergyRecords({ id: recordId });
      if (response.data && response.data.length > 0) {
        const record = response.data[0];
        form.setFieldsValue({
          ...record,
          consumption_date: dayjs(record.consumption_date),
          consumption_time: record.consumption_time ? dayjs(record.consumption_time, 'HH:mm:ss') : null,
        });
      }
    } catch (error) {
      message.error('Failed to fetch record details');
      console.error('Error fetching record:', error);
    } finally {
      setLoading(false);
    }
  };

  const onFinish = async (values) => {
    setSubmitting(true);
    try {
      const formattedValues = {
        ...values,
        consumption_date: values.consumption_date.format('YYYY-MM-DD'),
        consumption_time: values.consumption_time ? values.consumption_time.format('HH:mm:ss') : null,
        energy_used_kwh: parseFloat(values.energy_used_kwh),
      };

      if (isEditMode) {
        await updateEnergyRecord(id, formattedValues);
        message.success('Record updated successfully');
      } else {
        await createEnergyRecord(formattedValues);
        message.success('Record created successfully');
      }
      
      navigate('/energy-consumption');
    } catch (error) {
      const errorMessage = isEditMode 
        ? 'Failed to update record' 
        : 'Failed to create record';
      message.error(errorMessage);
      console.error('Error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handlePeriodTypeChange = (value) => {
    form.setFieldsValue({ consumption_time: null });
  };

  return (
    <Card 
      title={isEditMode ? 'Edit Energy Consumption Record' : 'Add New Energy Consumption Record'}
      style={{ maxWidth: 800, margin: '0 auto' }}
    >
      <Spin spinning={loading}>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{
            period_type: 'daily',
          }}
        >
          <Form.Item
            name="consumption_date"
            label="Date"
            rules={[{ required: true, message: 'Please select a date' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="period_type"
            label="Period Type"
            rules={[{ required: true, message: 'Please select period type' }]}
          >
            <Select onChange={handlePeriodTypeChange}>
              <Option value="hourly">Hourly</Option>
              <Option value="daily">Daily</Option>
              <Option value="monthly">Monthly</Option>
            </Select>
          </Form.Item>

          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) => 
              prevValues.period_type !== currentValues.period_type
            }
          >
            {({ getFieldValue }) =>
              getFieldValue('period_type') === 'hourly' ? (
                <Form.Item
                  name="consumption_time"
                  label="Time"
                  rules={[{ required: true, message: 'Please select time' }]}
                >
                  <TimePicker format="HH:mm" style={{ width: '100%' }} />
                </Form.Item>
              ) : null
            }
          </Form.Item>

          <Form.Item
            name="energy_used_kwh"
            label="Energy Used (kWh)"
            rules={[
              { required: true, message: 'Please enter energy used' },
              {
                pattern: /^\d+(\.\d{1,2})?$/,
                message: 'Please enter a valid number',
              },
            ]}
          >
            <Input type="number" step="0.01" min="0" />
          </Form.Item>

          <Form.Item style={{ marginTop: 24 }}>
            <Space>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={submitting}
              >
                {isEditMode ? 'Update' : 'Create'}
              </Button>
              <Button onClick={() => navigate('/energy-consumption')}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Spin>
    </Card>
  );
};

export default ConsumptionForm;
