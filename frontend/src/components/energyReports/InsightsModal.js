import React, { useState, useEffect } from 'react';
import { billService } from '../../services/api';
import Modal from '../common/Modal';

const InsightsModal = ({ isOpen, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [monthlyData, setMonthlyData] = useState([]);
  const [availableYears, setAvailableYears] = useState([]);

  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  useEffect(() => {
    if (isOpen) {
      fetchInsightsData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, selectedYear]);

  const fetchInsightsData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch all bills to calculate insights
      const response = await billService.getAllBills();
      const bills = response.data.data.bills;
      
      // Get available years from bills
      const years = [...new Set(bills.map(bill => 
        new Date(bill.billIssueDate).getFullYear()
      ))].sort((a, b) => b - a);
      setAvailableYears(years);
      
      // Filter bills for selected year
      const yearBills = bills.filter(bill => 
        new Date(bill.billIssueDate).getFullYear() === selectedYear
      );
      
      // Create monthly data array
      const monthlyStats = Array(12).fill().map((_, index) => {
        const monthBills = yearBills.filter(bill => 
          new Date(bill.billIssueDate).getMonth() === index
        );
        
        const totalKWh = monthBills.reduce((sum, bill) => sum + bill.totalKWh, 0);
        const totalPayment = monthBills.reduce((sum, bill) => sum + bill.totalPayment, 0);
        const billCount = monthBills.length;
        
        return {
          month: monthNames[index],
          monthIndex: index,
          totalKWh: totalKWh,
          totalPayment: totalPayment,
          billCount: billCount,
          averageKWh: billCount > 0 ? totalKWh / billCount : 0
        };
      });
      
      setMonthlyData(monthlyStats);
    } catch (err) {
      setError('Failed to fetch insights data');
      console.error('Error fetching insights:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const getMaxValue = () => {
    return Math.max(...monthlyData.map(data => data.totalKWh), 1);
  };

  const getBarHeight = (value, maxValue) => {
    return Math.max((value / maxValue) * 100, 2); // Minimum 2% for visibility
  };

  const totalYearConsumption = monthlyData.reduce((sum, data) => sum + data.totalKWh, 0);
  const totalYearPayment = monthlyData.reduce((sum, data) => sum + data.totalPayment, 0);
  const averageMonthlyConsumption = totalYearConsumption / 12;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Energy Consumption Insights"
      size="large"
    >
      <div className="space-y-6">
        {/* Year Filter */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Monthly Consumption for {selectedYear}
          </h3>
          <div className="flex items-center space-x-3">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Year:
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="input-field w-auto min-w-[120px]"
            >
              {availableYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="loading-spinner w-12 h-12"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
              <span>{error}</span>
            </div>
          </div>
        ) : (
          <>
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-gradient-to-r from-primary/10 to-secondary/10 dark:from-primary/20 dark:to-secondary/20 rounded-2xl p-6">
                <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Total Consumption</h4>
                <p className="text-2xl font-bold text-primary">{totalYearConsumption.toFixed(1)} kWh</p>
              </div>
              <div className="bg-gradient-to-r from-accent/10 to-primary/10 dark:from-accent/20 dark:to-primary/20 rounded-2xl p-6">
                <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Total Payment</h4>
                <p className="text-2xl font-bold text-accent dark:text-yellow-400">{formatCurrency(totalYearPayment)}</p>
              </div>
              <div className="bg-gradient-to-r from-secondary/10 to-accent/10 dark:from-secondary/20 dark:to-accent/20 rounded-2xl p-6">
                <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Monthly Average</h4>
                <p className="text-2xl font-bold text-secondary">{averageMonthlyConsumption.toFixed(1)} kWh</p>
              </div>
            </div>

            {/* Bar Chart */}
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-6">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">Monthly Consumption (kWh)</h4>
              <div className="h-80 flex items-end justify-between space-x-2">
                {monthlyData.map((data, index) => {
                  const maxValue = getMaxValue();
                  const height = getBarHeight(data.totalKWh, maxValue);
                  
                  return (
                    <div key={index} className="flex-1 flex flex-col items-center group">
                      {/* Bar */}
                      <div className="relative w-full flex items-end justify-center mb-3" style={{ height: '240px' }}>
                        <div
                          className={`
                            w-full max-w-16 rounded-t-lg transition-all duration-300 group-hover:scale-105
                            ${data.totalKWh > 0 
                              ? 'bg-gradient-to-t from-primary to-secondary' 
                              : 'bg-gray-200 dark:bg-gray-700'
                            }
                          `}
                          style={{ height: `${height}%` }}
                        >
                          {/* Tooltip */}
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                            <div className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-lg">
                              <div className="font-semibold">{data.month} {selectedYear}</div>
                              <div>{data.totalKWh.toFixed(1)} kWh</div>
                              <div>{formatCurrency(data.totalPayment)}</div>
                              <div>{data.billCount} bill(s)</div>
                              <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900 dark:border-t-gray-100"></div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Month Label */}
                      <div className="text-xs font-medium text-gray-600 dark:text-gray-400 text-center">
                        {data.month}
                      </div>
                      
                      {/* Value Label */}
                      <div className="text-xs text-gray-500 dark:text-gray-500 text-center mt-1">
                        {data.totalKWh > 0 ? `${data.totalKWh.toFixed(0)}` : '0'}
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* Y-axis labels */}
              <div className="mt-4 text-xs text-gray-500 dark:text-gray-500 text-center">
                Energy Consumption (kWh)
              </div>
            </div>

            {/* Additional Insights */}
            {monthlyData.some(data => data.totalKWh > 0) && (
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-6">
                <h4 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-4">
                  💡 Insights & Tips
                </h4>
                <div className="space-y-3 text-sm text-blue-800 dark:text-blue-200">
                  {(() => {
                    const maxMonth = monthlyData.reduce((max, current) => 
                      current.totalKWh > max.totalKWh ? current : max
                    );
                    const minMonth = monthlyData.reduce((min, current) => 
                      current.totalKWh > 0 && current.totalKWh < min.totalKWh ? current : min
                    );
                    
                    return (
                      <>
                        <p>• Highest consumption was in <strong>{maxMonth.month}</strong> with {maxMonth.totalKWh.toFixed(1)} kWh</p>
                        {minMonth.totalKWh > 0 && (
                          <p>• Lowest consumption was in <strong>{minMonth.month}</strong> with {minMonth.totalKWh.toFixed(1)} kWh</p>
                        )}
                        <p>• Consider energy-saving measures during peak consumption months</p>
                        <p>• Monitor seasonal patterns to optimize your energy usage</p>
                      </>
                    );
                  })()}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  );
};

export default InsightsModal;
