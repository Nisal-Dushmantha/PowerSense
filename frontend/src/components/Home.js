import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../services/authService';
import { dashboardService } from '../services/api';

const Home = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      const authenticated = authService.isAuthenticated();
      setIsAuthenticated(authenticated);
      if (authenticated) {
        const userData = authService.getStoredUser();
        setUser(userData);
      } else {
        setSummary(null);
      }
    };

    checkAuth();
  }, []);

  useEffect(() => {
    const fetchSummary = async () => {
      if (!isAuthenticated) return;

      try {
        setSummaryLoading(true);
        const response = await dashboardService.getSummary();
        setSummary(response.data?.data || null);
      } catch (error) {
        console.error('Failed to load dashboard summary:', error);
      } finally {
        setSummaryLoading(false);
      }
    };

    fetchSummary();
  }, [isAuthenticated]);

  // If user is authenticated, show dashboard-style homepage
  if (isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-white to-background/50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="max-w-7xl mx-auto container-padding py-12">
          {/* Welcome Section */}
          <div className="text-center mb-12 fade-in">
            <h1 className="text-4xl lg:text-6xl font-bold text-textPrimary dark:text-gray-100 mb-4">
              Welcome back, <span className="text-gradient">{user?.firstName}</span>
            </h1>
            <p className="text-xl text-textSecondary dark:text-gray-300 max-w-2xl mx-auto">
              Your energy management dashboard is ready. Track your bills, monitor consumption patterns, and optimize your electricity usage.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            <div className="bg-white/70 dark:bg-gray-800/70 rounded-2xl p-5 border border-gray-200/50 dark:border-gray-600/50">
              <p className="text-sm text-textSecondary dark:text-gray-300">This Month Usage</p>
              <p className="text-2xl font-bold text-textPrimary dark:text-gray-100 mt-1">
                {summaryLoading ? '...' : `${summary?.consumption?.thisMonthKwh || 0} kWh`}
              </p>
            </div>
            <div className="bg-white/70 dark:bg-gray-800/70 rounded-2xl p-5 border border-gray-200/50 dark:border-gray-600/50">
              <p className="text-sm text-textSecondary dark:text-gray-300">Registered Devices</p>
              <p className="text-2xl font-bold text-textPrimary dark:text-gray-100 mt-1">
                {summaryLoading ? '...' : summary?.devices?.totalDevices || 0}
              </p>
            </div>
            <div className="bg-white/70 dark:bg-gray-800/70 rounded-2xl p-5 border border-gray-200/50 dark:border-gray-600/50">
              <p className="text-sm text-textSecondary dark:text-gray-300">Pending Bills</p>
              <p className="text-2xl font-bold text-textPrimary dark:text-gray-100 mt-1">
                {summaryLoading ? '...' : summary?.bills?.pendingCount || 0}
              </p>
            </div>
            <div className="bg-white/70 dark:bg-gray-800/70 rounded-2xl p-5 border border-gray-200/50 dark:border-gray-600/50">
              <p className="text-sm text-textSecondary dark:text-gray-300">Renewable This Month</p>
              <p className="text-2xl font-bold text-textPrimary dark:text-gray-100 mt-1">
                {summaryLoading ? '...' : `${summary?.renewable?.thisMonthKwh || 0} kWh`}
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <Link
              to="/bills"
              className="group bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-3xl p-8 border border-gray-200/50 dark:border-gray-600/50 hover:bg-white dark:hover:bg-gray-800 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"
            >
              <div className="w-16 h-16 bg-gradient-to-r from-primary to-secondary rounded-2xl flex items-center justify-center mb-6 transform group-hover:scale-110 transition-transform">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"/>
                  <polyline points="14,2 14,8 20,8"/>
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-textPrimary dark:text-gray-100 mb-3">Manage Bills</h3>
              <p className="text-textSecondary dark:text-gray-300">Add, edit, and track your electricity bills with ease.</p>
            </Link>

            <Link
              to="/bills/new"
              className="group bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-3xl p-8 border border-gray-200/50 dark:border-gray-600/50 hover:bg-white dark:hover:bg-gray-800 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"
            >
              <div className="w-16 h-16 bg-gradient-to-r from-accent to-primary rounded-2xl flex items-center justify-center mb-6 transform group-hover:scale-110 transition-transform">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <path d="M12 5v14m-7-7h14"/>
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-textPrimary dark:text-gray-100 mb-3">Add New Bill</h3>
              <p className="text-textSecondary dark:text-gray-300">Record your latest electricity bill quickly.</p>
            </Link>

            <Link
              to="/consumption"
              className="group bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-3xl p-8 border border-gray-200/50 dark:border-gray-600/50 hover:bg-white dark:hover:bg-gray-800 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"
            >
              <div className="w-16 h-16 bg-gradient-to-r from-secondary to-accent rounded-2xl flex items-center justify-center mb-6 transform group-hover:scale-110 transition-transform">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-textPrimary dark:text-gray-100 mb-3">Energy Consumption</h3>
              <p className="text-textSecondary dark:text-gray-300">Monitor your energy usage patterns.</p>
            </Link>
          </div>

          {/* Energy Tips Section */}
          <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-3xl p-8 border border-gray-200/50 dark:border-gray-600/50">
            <h2 className="text-3xl font-bold text-textPrimary dark:text-gray-100 mb-8 text-center">
              💡 Energy Saving Tips
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-primary/10 dark:bg-primary/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-primary" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
                <h4 className="font-semibold text-textPrimary dark:text-gray-100 mb-2">LED Lighting</h4>
                <p className="text-sm text-textSecondary dark:text-gray-300">Switch to LED bulbs to reduce energy consumption by up to 80%</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-secondary/10 dark:bg-secondary/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-secondary" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707"/>
                  </svg>
                </div>
                <h4 className="font-semibold text-textPrimary mb-2">Smart Thermostat</h4>
                <p className="text-sm text-textSecondary">Optimize heating and cooling with programmable settings</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-accent" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
                  </svg>
                </div>
                <h4 className="font-semibold text-textPrimary mb-2">Unplug Devices</h4>
                <p className="text-sm text-textSecondary">Eliminate phantom loads from devices on standby</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-primary" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"/>
                  </svg>
                </div>
                <h4 className="font-semibold text-textPrimary mb-2">Peak Hours</h4>
                <p className="text-sm text-textSecondary">Avoid high-demand periods to reduce your bill</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-white to-background/50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        <div className="relative max-w-7xl mx-auto container-padding py-20 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-8 fade-in">
              <div className="space-y-4">
                <div className="inline-flex items-center px-3 py-1 bg-primary/10 rounded-full">
                  <svg className="w-4 h-4 text-primary mr-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
                  </svg>
                  <span className="text-sm font-medium text-primary">POWER AND EFFICIENCY TODAY</span>
                </div>
                
                <h1 className="text-5xl lg:text-7xl font-bold text-textPrimary leading-tight">
                  WE MANAGE
                  <br />
                  <span className="text-gradient">ENERGY TOGETHER</span>
                </h1>
                
                <p className="text-xl text-textSecondary leading-relaxed max-w-lg">
                  Take control of your electricity consumption with our intelligent bill management system. 
                  Track, analyze, and optimize your energy usage for a sustainable future.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link 
                  to="/register" 
                  className="btn-primary btn-lg group"
                >
                  <span>GET STARTED</span>
                  <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M14 6l6 6-6 6M4 12h16"/>
                  </svg>
                </Link>
                
                <Link 
                  to="/login" 
                  className="btn-secondary btn-lg"
                >
                  Sign In
                </Link>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-8 pt-8 border-t border-gray-200">
                <div>
                  <div className="text-3xl font-bold text-primary">500+</div>
                  <div className="text-sm text-textSecondary">Active Users</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-secondary">₹2.5M+</div>
                  <div className="text-sm text-textSecondary">Bills Managed</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-accent">98%</div>
                  <div className="text-sm text-textSecondary">Accuracy Rate</div>
                </div>
              </div>
            </div>

            {/* Right Visual */}
            <div className="relative scale-in">
              <div className="relative">
                {/* Main Dashboard Mockup */}
                <div className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-100">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-primary to-secondary rounded-lg"></div>
                      <span className="font-semibold text-textPrimary">Dashboard</span>
                    </div>
                    <div className="flex space-x-2">
                      <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                      <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                      <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                    </div>
                  </div>

                  {/* Mock Chart */}
                  <div className="space-y-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-textSecondary">Monthly Usage</span>
                      <span className="font-semibold text-primary">1,248 kWh</span>
                    </div>
                    
                    <div className="h-32 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-xl relative overflow-hidden">
                      {/* Mock chart bars */}
                      <div className="absolute bottom-0 left-0 w-full flex items-end justify-between p-4 space-x-2">
                        {[65, 45, 80, 90, 55, 75, 85].map((height, idx) => (
                          <div
                            key={idx}
                            className="bg-gradient-to-t from-primary to-secondary rounded-t-lg flex-1 transition-all duration-500"
                            style={{ height: `${height}%` }}
                          ></div>
                        ))}
                      </div>
                    </div>

                    {/* Mock Bill Items */}
                    <div className="space-y-3 pt-4">
                      <div className="flex justify-between items-center p-3 bg-background rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-sm font-medium">January 2026</span>
                        </div>
                        <span className="text-sm font-semibold text-green-600">₹2,450</span>
                      </div>
                      
                      <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                          <span className="text-sm font-medium">February 2026</span>
                        </div>
                        <span className="text-sm font-semibold text-yellow-600">₹3,120</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating Elements */}
                <div className="absolute -top-6 -right-6 w-24 h-24 bg-gradient-to-br from-accent to-yellow-300 rounded-full opacity-20 animate-pulse"></div>
                <div className="absolute -bottom-6 -left-6 w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-full opacity-30 animate-bounce" style={{ animationDelay: '1s' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto container-padding">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-textPrimary mb-4">
              Why Choose PowerSense?
            </h2>
            <p className="text-xl text-textSecondary max-w-3xl mx-auto">
              Our comprehensive energy management platform provides everything you need to take control of your electricity usage and costs.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="card card-hover">
              <div className="card-body text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"/>
                    <polyline points="14,2 14,8 20,8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-textPrimary mb-3">Smart Bill Tracking</h3>
                <p className="text-textSecondary">
                  Automatically organize and track all your electricity bills with intelligent categorization and payment reminders.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="card card-hover">
              <div className="card-body text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-secondary to-primary rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 20V10M6 20V4m12 16V8"/>
                    <path d="M3 18h18M3 12h18M3 6h18"/>
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-textPrimary mb-3">Usage Analytics</h3>
                <p className="text-textSecondary">
                  Get detailed insights into your energy consumption patterns with interactive charts and trend analysis.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="card card-hover">
              <div className="card-body text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-accent to-yellow-400 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 text-textPrimary" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l9 11h-6v7h-6v-7H3l9-11z"/>
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-textPrimary mb-3">Cost Optimization</h3>
                <p className="text-textSecondary">
                  Receive personalized recommendations to reduce your electricity costs and improve energy efficiency.
                </p>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="card card-hover">
              <div className="card-body text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-textPrimary mb-3">Secure & Reliable</h3>
                <p className="text-textSecondary">
                  Your data is protected with enterprise-grade security and backed up automatically for peace of mind.
                </p>
              </div>
            </div>

            {/* Feature 5 */}
            <div className="card card-hover">
              <div className="card-body text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-textPrimary mb-3">Easy Integration</h3>
                <p className="text-textSecondary">
                  Simple setup process with automatic bill import from major electricity providers across the country.
                </p>
              </div>
            </div>

            {/* Feature 6 */}
            <div className="card card-hover">
              <div className="card-body text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-textPrimary mb-3">24/7 Support</h3>
                <p className="text-textSecondary">
                  Get help whenever you need it with our dedicated customer support team available around the clock.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary via-secondary to-primary relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative max-w-4xl mx-auto text-center container-padding">
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
            Ready to Take Control of Your Energy?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Join thousands of users who are already saving money and reducing their environmental impact with PowerSense.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to="/register" 
              className="btn bg-white text-primary hover:bg-gray-100 btn-lg"
            >
              Start Free Trial
            </Link>
            <Link 
              to="/login" 
              className="btn bg-transparent text-white border-2 border-white hover:bg-white hover:text-primary btn-lg"
            >
              Learn More
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-textPrimary text-white py-12">
        <div className="max-w-7xl mx-auto container-padding">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-r from-primary to-secondary rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
                  </svg>
                </div>
                <span className="text-xl font-bold">PowerSense</span>
              </div>
              <p className="text-gray-400 mb-4 max-w-md">
                Intelligent energy management for a sustainable future. Track, analyze, and optimize your electricity usage with ease.
              </p>
              <div className="flex space-x-4">
                <button className="text-gray-400 hover:text-primary transition-colors" aria-label="Twitter">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                  </svg>
                </button>
                <button className="text-gray-400 hover:text-primary transition-colors" aria-label="LinkedIn">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z"/>
                  </svg>
                </button>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold text-lg mb-4">Product</h3>
              <ul className="space-y-2 text-gray-400">
                <li><button className="hover:text-primary transition-colors text-left">Features</button></li>
                <li><button className="hover:text-primary transition-colors text-left">Pricing</button></li>
                <li><button className="hover:text-primary transition-colors text-left">API</button></li>
                <li><button className="hover:text-primary transition-colors text-left">Security</button></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-lg mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400">
                <li><button className="hover:text-primary transition-colors text-left">About</button></li>
                <li><button className="hover:text-primary transition-colors text-left">Contact</button></li>
                <li><button className="hover:text-primary transition-colors text-left">Privacy</button></li>
                <li><button className="hover:text-primary transition-colors text-left">Terms</button></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2026 PowerSense. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
