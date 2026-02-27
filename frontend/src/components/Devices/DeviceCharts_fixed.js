import React, { useState } from 'react';
import { Column, Pie } from '@ant-design/charts';

const DeviceCharts = ({ devices }) => {
    const [activeTab, setActiveTab] = useState('daily');

    // Group devices by type and aggregate consumption (using backend-calculated values)
    const typeConsumption = {};
    
    devices.forEach(device => {
        // Use pre-calculated values from backend
        const dailyW = device.dailyW || 0;
        const monthlyW = device.monthlyW || 0;
        
        if (!typeConsumption[device.type]) {
            typeConsumption[device.type] = {
                type: device.type,
                dailyW: 0,
                monthlyW: 0,
                deviceCount: 0,
                totalPowerRating: 0
            };
        }
        
        typeConsumption[device.type].dailyW += dailyW;
        typeConsumption[device.type].monthlyW += monthlyW;
        typeConsumption[device.type].deviceCount += 1;
        typeConsumption[device.type].totalPowerRating += device.powerRating;
    });

    const chartData = Object.values(typeConsumption).map(item => ({
        type: item.type,
        dailyW: parseFloat(item.dailyW.toFixed(0)),
        monthlyW: parseFloat(item.monthlyW.toFixed(0)),
        deviceCount: item.deviceCount,
        averagePower: Math.round(item.totalPowerRating / item.deviceCount)
    }));

    // Column chart config for daily consumption
    const dailyColumnConfig = {
        data: chartData,
        xField: 'type',
        yField: 'dailyW',
        columnWidthRatio: 0.7,
        color: '#1890ff',
        columnStyle: {
            radius: [4, 4, 0, 0],
            cursor: 'pointer'
        },
        yAxis: {
            title: {
                text: 'Daily Consumption (W)'
            }
        },
        tooltip: {
            showTitle: true,
            title: (data) => `📱 ${data.type} - ${data.dailyW} W`
        }
    };

    // Column chart config for monthly consumption
    const monthlyColumnConfig = {
        data: chartData,
        xField: 'type',
        yField: 'monthlyW',
        columnWidthRatio: 0.7,
        color: '#52c41a',
        columnStyle: {
            radius: [4, 4, 0, 0],
            cursor: 'pointer'
        },
        yAxis: {
            title: {
                text: 'Monthly Consumption (W)'
            }
        },
        tooltip: {
            showTitle: true,
            title: (data) => `📱 ${data.type} - ${data.monthlyW} W`
        }
    };

    // Pie chart config for consumption distribution
    const pieConfig = {
        data: chartData,
        angleField: activeTab === 'daily' ? 'dailyW' : 'monthlyW',
        colorField: 'type',
        radius: 0.8,
        interactions: [
            { type: 'element-selected' },
            { type: 'element-active' }
        ]
    };

    if (!devices || devices.length === 0) {
        return (
            <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Device Consumption Charts</h3>
                <div className="text-center py-8">
                    <p className="text-gray-500">No devices available to display charts</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-800">Device Type Consumption Charts</h3>
                
                {/* Tab Selector */}
                <div className="flex bg-gray-100 rounded-lg p-1">
                        <button
                            onClick={() => setActiveTab('daily')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                activeTab === 'daily'
                                    ? 'bg-white text-blue-600 shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            Daily View
                        </button>
                        <button
                            onClick={() => setActiveTab('monthly')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                activeTab === 'monthly'
                                    ? 'bg-white text-blue-600 shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            Monthly View
                        </button>
                    </div>
                </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Bar Chart */}
                <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-md font-medium text-gray-700 mb-4">
                        {activeTab === 'daily' ? 'Daily Consumption (W)' : 'Monthly Consumption (W)'}
                    </h4>
                    <div className="h-64">
                        <Column 
                            {...(activeTab === 'daily' ? dailyColumnConfig : monthlyColumnConfig)} 
                            height={240}
                        />
                    </div>
                </div>

                {/* Pie Chart */}
                <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-md font-medium text-gray-700 mb-4">
                        {activeTab === 'daily' ? 'Daily' : 'Monthly'} Consumption Distribution
                    </h4>
                    <div className="h-64">
                        <Pie {...pieConfig} height={240} />
                    </div>
                </div>
            </div>

            {/* Statistics Summary */}
            <div className="mt-6 bg-gray-50 rounded-lg p-4">
                <h4 className="text-md font-medium text-gray-700 mb-4">Device Type Statistics</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {chartData.map((item, index) => (
                        <div key={index} className="bg-white rounded-lg p-3 border border-gray-200">
                            <h5 className="font-medium text-gray-800 mb-2">{item.type}</h5>
                            <div className="space-y-1 text-sm text-gray-600">
                                <p>Daily: <span className="font-medium text-green-600">{item.dailyW} W</span></p>
                                <p>Monthly: <span className="font-medium text-blue-600">{item.monthlyW} W</span></p>
                                <p>Devices: <span className="font-medium">{item.deviceCount}</span></p>
                                <p>Avg Power: <span className="font-medium">{item.averagePower}W</span></p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Chart Legend/Info */}
            <div className="mt-6 bg-blue-50 rounded-lg p-4">
                <div className="flex items-start">
                    <svg className="w-5 h-5 text-blue-500 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <div>
                        <p className="text-sm text-blue-800 font-medium">Chart Information</p>
                        <p className="text-sm text-blue-600 mt-1">
                            Charts show energy consumption grouped by device type. Data is pre-calculated on the backend from device power ratings and daily usage hours. 
                            Each device type may include multiple devices. 
                            Hover over chart elements for detailed information. Use the tabs to switch between daily and monthly views.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DeviceCharts;