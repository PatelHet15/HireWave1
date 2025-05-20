import React, { useState, useEffect } from 'react';
import Navbar from '../shared/Navbar';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';
import axios from 'axios';
import { ANALYTICS_API_END_POINT } from '@/utils/constant';
import { 
  BarChart3, 
  PieChart as PieChartIcon, 
  LineChart as LineChartIcon, 
  Users, 
  BriefcaseBusiness, 
  Layers, 
  Calendar, 
  ArrowUp, 
  ArrowDown, 
  Sparkles,
  Eye,
  MousePointerClick,
  UserCheck,
  DollarSign,
  DownloadCloud
} from 'lucide-react';

// Mock data for charts - in a real app this would come from an API
const mockApplicationsData = [
  { name: 'Week 1', applications: 15 },
  { name: 'Week 2', applications: 23 },
  { name: 'Week 3', applications: 18 },
  { name: 'Week 4', applications: 32 },
  { name: 'Week 5', applications: 27 },
  { name: 'Week 6', applications: 45 },
  { name: 'Week 7', applications: 38 },
  { name: 'Week 8', applications: 51 },
];

const mockViewsData = [
  { name: 'Sep 1', views: 150 },
  { name: 'Sep 8', views: 230 },
  { name: 'Sep 15', views: 280 },
  { name: 'Sep 22', views: 320 },
  { name: 'Sep 29', views: 360 },
  { name: 'Oct 6', views: 420 },
  { name: 'Oct 13', views: 450 },
  { name: 'Oct 20', views: 510 },
];

const mockSourcesData = [
  { name: 'LinkedIn', value: 45 },
  { name: 'Direct', value: 25 },
  { name: 'Indeed', value: 15 },
  { name: 'Referrals', value: 10 },
  { name: 'Other', value: 5 },
];

const mockPositionStats = [
  { 
    id: 1,
    title: 'senior Software Engineer',
    views: 1240,
    applications: 68,
    interviews: 12,
    conversionRate: '5.5%',
    status: 'Active',
  },
  { 
    id: 2, 
    title: 'UX Designer', 
    views: 980, 
    applications: 54, 
    interviews: 8,
    conversionRate: '5.5%',
    status: 'Active',
  },
  { 
    id: 3, 
    title: 'Product Manager', 
    views: 820, 
    applications: 32, 
    interviews: 6,
    conversionRate: '3.9%',
    status: 'Active',
  },
  { 
    id: 4, 
    title: 'Frontend Developer', 
    views: 1430, 
    applications: 82, 
    interviews: 15,
    conversionRate: '5.7%',
    status: 'Active',
  },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A569BD'];

const RecruiterAnalytics = () => {
  const { user } = useSelector(state => state.auth);
  const [timeRange, setTimeRange] = useState('30days');
  const [isLoading, setIsLoading] = useState(false);
  const [analyticsData, setAnalyticsData] = useState({
    kpiData: {
      totalApplications: 0,
      applicationGrowth: 0,
      totalViews: 0,
      viewsGrowth: 0,
      conversionRate: 0,
      conversionGrowth: 0,
      activeJobs: 0,
    },
    applicationsData: [],
    viewsData: [],
    positionStats: []
  });
  // No longer need separate state for total active jobs
  
  // Function to load analytics data
  const loadData = async () => {
    setIsLoading(true);
    try {
      console.log('Fetching analytics data with timeRange:', timeRange);
      
      // Add cache-busting parameter to prevent caching
      const timestamp = new Date().getTime();
      const response = await axios.get(`${ANALYTICS_API_END_POINT}/recruiter?timeRange=${timeRange}&_=${timestamp}`, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });
      
      if (response.data.success) {
        console.log('Analytics data loaded successfully');
        console.log('Raw response data:', response.data.data);
        console.log('KPI data:', response.data.data.kpiData);
        console.log('Total views:', response.data.data.kpiData.totalViews);
        console.log('System-wide views:', response.data.data.kpiData.systemWideViews);
        console.log('System-wide applications:', response.data.data.kpiData.systemWideApplyClicks);
        console.log('Total active jobs:', response.data.data.kpiData.totalActiveJobs || response.data.data.kpiData.activeJobs);
        
        // Force a re-render by creating a new object with a timestamp to ensure React detects the change
        const updatedData = {
          ...response.data.data,
          _timestamp: new Date().getTime() // Add timestamp to force React to detect changes
        };
        
        console.log('Setting analytics data:', updatedData);
        setAnalyticsData(updatedData);
      }
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // No longer need separate function to fetch total active jobs

  // Refresh data when time range changes
  useEffect(() => {
    loadData();
  }, [timeRange]);
  
  // Set up periodic refresh (every 5 seconds)

  
  return (
    <div className="bg-gray-50 min-h-screen">
      <Navbar />
      <div className="max-w-7xl mx-auto py-8 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-8"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Recruitment Analytics</h1>
              <p className="text-gray-500 mt-1">Track your job postings and application performance</p>
            </div>
            
            <div className="flex items-center mt-4 md:mt-0">
              <div className="mr-4">
                <Select value={timeRange} onValueChange={setTimeRange}>
                  <SelectTrigger className="min-w-[150px]">
                    <SelectValue placeholder="Time Range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7days">Last 7 days</SelectItem>
                    <SelectItem value="30days">Last 30 days</SelectItem>
                    <SelectItem value="90days">Last 90 days</SelectItem>
                    <SelectItem value="6months">Last 6 months</SelectItem>
                    <SelectItem value="1year">Last year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          {/* KPI Cards Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            {/* Total Applications Card */}
            <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Total Applications</p>
                    <h3 className="text-2xl font-bold mt-1">
                      {analyticsData.kpiData.systemWideApplyClicks !== undefined 
                        ? analyticsData.kpiData.systemWideApplyClicks 
                        : analyticsData.kpiData.totalApplications}
                    </h3>
                    <div className="flex items-center mt-1">
                      <span className={`text-xs font-medium flex items-center ${analyticsData.kpiData.applicationGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {analyticsData.kpiData.applicationGrowth >= 0 ? <ArrowUp className="h-3 w-3 mr-1" /> : <ArrowDown className="h-3 w-3 mr-1" />}
                        {Math.abs(analyticsData.kpiData.applicationGrowth)}%
                      </span>
                      <span className="text-xs text-gray-500 ml-1">vs previous period</span>
                    </div>
                  </div>
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Total Job Views Card */}
            <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Total Job Views</p>
                    <h3 className="text-2xl font-bold mt-1">
                      {analyticsData.kpiData.systemWideViews !== undefined 
                        ? analyticsData.kpiData.systemWideViews 
                        : analyticsData.kpiData.totalViews}
                    </h3>
                    <div className="flex items-center mt-1">
                      <span className={`text-xs font-medium flex items-center ${analyticsData.kpiData.viewsGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {analyticsData.kpiData.viewsGrowth >= 0 ? <ArrowUp className="h-3 w-3 mr-1" /> : <ArrowDown className="h-3 w-3 mr-1" />}
                        {Math.abs(analyticsData.kpiData.viewsGrowth)}%
                      </span>
                      <span className="text-xs text-gray-500 ml-1">vs previous period</span>
                    </div>
                  </div>
                  <div className="bg-indigo-100 p-3 rounded-lg">
                    <Eye className="h-6 w-6 text-indigo-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Conversion Rate Card */}
            <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Conversion Rate</p>
                    <h3 className="text-2xl font-bold mt-1">
                      {(() => {
                        const applications = analyticsData.kpiData.systemWideApplyClicks !== undefined 
                          ? analyticsData.kpiData.systemWideApplyClicks 
                          : analyticsData.kpiData.totalApplications;
                        
                        const views = analyticsData.kpiData.systemWideViews !== undefined 
                          ? analyticsData.kpiData.systemWideViews 
                          : analyticsData.kpiData.totalViews;
                        
                        // Calculate conversion rate - avoid division by zero
                        return views > 0 ? `${((applications / views) * 100).toFixed(1)}%` : '0%';
                      })()}
                    </h3>
                    <div className="flex items-center mt-1">
                      <span className={`text-xs font-medium flex items-center ${analyticsData.kpiData.conversionGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {analyticsData.kpiData.conversionGrowth >= 0 ? <ArrowUp className="h-3 w-3 mr-1" /> : <ArrowDown className="h-3 w-3 mr-1" />}
                        {Math.abs(analyticsData.kpiData.conversionGrowth)}%
                      </span>
                      <span className="text-xs text-gray-500 ml-1">vs previous period</span>
                    </div>
                  </div>
                  <div className="bg-green-100 p-3 rounded-lg">
                    <MousePointerClick className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Total Active Jobs Card */}
            <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Total Active Jobs</p>
                    <h3 className="text-2xl font-bold mt-1">
                      {analyticsData.kpiData.totalActiveJobs !== undefined 
                        ? analyticsData.kpiData.totalActiveJobs 
                        : analyticsData.kpiData.activeJobs}
                    </h3>
                    <div className="flex items-center mt-1">
                      <span className="text-xs text-gray-500">All open positions</span>
                    </div>
                  </div>
                  <div className="bg-amber-100 p-3 rounded-lg">
                    <BriefcaseBusiness className="h-6 w-6 text-amber-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <Card className="lg:col-span-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Applications Over Time</CardTitle>
                  <BarChart3 className="h-4 w-4 text-gray-400" />
                </div>
                <CardDescription>Weekly application volume for your job postings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80 w-full">
                  {isLoading ? (
                    <div className="h-full w-full flex items-center justify-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={analyticsData.applicationsData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} />
                        <YAxis axisLine={false} tickLine={false} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#fff', 
                            border: '1px solid #e2e8f0',
                            borderRadius: '0.5rem',
                            boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                          }} 
                        />
                        <Bar dataKey="applications" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Application Sources</CardTitle>
                  <PieChartIcon className="h-4 w-4 text-gray-400" />
                </div>
                <CardDescription>Where your applicants are coming from</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80 w-full">
                  {isLoading ? (
                    <div className="h-full w-full flex items-center justify-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={mockSourcesData}
                          cx="50%"
                          cy="50%"
                          innerRadius={70}
                          outerRadius={90}
                          fill="#8884d8"
                          paddingAngle={5}
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {mockSourcesData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Job Position Stats */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Job Position Performance</CardTitle>
                <LineChartIcon className="h-4 w-4 text-gray-400" />
              </div>
              <CardDescription>
                Performance metrics for your active job positions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-40 w-full flex items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs uppercase text-gray-500 bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 rounded-l-lg">Position</th>
                        <th className="px-4 py-3">Company</th>
                        <th className="px-4 py-3">Views</th>
                        <th className="px-4 py-3">Applications</th>
                        <th className="px-4 py-3">Conversion Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analyticsData.positionStats.map((position) => (
                        <tr key={position.id} className="border-b border-gray-100">
                          <td className="px-4 py-4 font-medium text-gray-900">{position.title}</td>
                          <td className="px-4 py-4">{position.company}</td>
                          <td className="px-4 py-4">{position.views.toLocaleString()}</td>
                          <td className="px-4 py-4">{position.applications}</td>
                          <td className="px-4 py-4">{position.conversionRate}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Insights Card */}
          <Card className="mt-6">
            <CardHeader>
              <div className="flex items-center">
                <Sparkles className="h-5 w-5 text-yellow-500 mr-2" />
                <CardTitle>Recruiting Insights</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-medium text-blue-800 mb-2">Application Trends</h3>
                  <p className="text-sm text-blue-700">
                    Your application rate has {analyticsData.kpiData.applicationGrowth >= 0 ? 'increased' : 'decreased'} by {Math.abs(analyticsData.kpiData.applicationGrowth)}% this period.
                    {analyticsData.positionStats.length > 0 ? ` The ${analyticsData.positionStats[0].title} position has the highest conversion rate at ${analyticsData.positionStats[0].conversionRate}.` : ''}
                  </p>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-medium text-green-800 mb-2">Optimization Tips</h3>
                  <p className="text-sm text-green-700">
                    {analyticsData.kpiData.conversionRate < 5 ? 'Consider improving your job descriptions to increase your conversion rate.' : 'Your conversion rate is healthy. Keep up the good work!'}
                    Most successful applications come from LinkedIn and direct website visits.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default RecruiterAnalytics; 