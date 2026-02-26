import React, { useState, useEffect } from 'react';
import { deviceService } from '../../services/api';
import DeviceCharts from './DeviceCharts';
import { Link } from 'react-router-dom';

const DeviceChartsPage = () => {
    const [devices, setDevices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchDevices();
    }, []);

    const fetchDevices = async () => {
        try {
            setLoading(true);
            const res = await deviceService.getAllDevices();
            const payload = res.data.data || res.data;
            setDevices(payload.devices || payload || []);
            setError(null);
        } catch (err) {
            console.error('Error fetching devices', err);
            setError('Failed to load devices');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="flex justify-center items-center h-48">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="text-center py-12">
                    <div className="text-red-600 mb-4">{error}</div>
                    <button 
                        onClick={fetchDevices}
                        className="btn-primary"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Energy Consumption Charts</h1>
                    <p className="text-gray-600 mt-2">Visualize your device energy consumption by type</p>
                </div>
                <Link 
                    to="/devices" 
                    className="btn-secondary flex items-center space-x-2"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    <span>Back to Devices</span>
                </Link>
            </div>

            {devices.length === 0 ? (
                <div className="bg-white rounded-lg shadow-lg p-8 text-center">
                    <h3 className="text-xl text-gray-600 mb-4">No devices found</h3>
                    <p className="text-gray-500 mb-6">Add some devices first to see consumption charts.</p>
                    <Link 
                        to="/devices" 
                        className="btn-primary"
                    >
                        Go to Devices
                    </Link>
                </div>
            ) : (
                <DeviceCharts devices={devices} />
            )}
        </div>
    );
};

export default DeviceChartsPage;