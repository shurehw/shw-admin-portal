'use client';

import { useState, useEffect } from 'react';
import CRMLayout from '@/components/CRMLayout';
import { 
  BarChart3, TrendingUp, DollarSign, Users, Building2, 
  Calendar, Download, Filter, RefreshCw, Target, 
  Phone, Mail, MessageSquare, Handshake, CheckCircle2
} from 'lucide-react';
import { db } from '@/lib/firebase-client';
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy 
} from 'firebase/firestore';

interface ReportData {
  deals: any[];
  contacts: any[];
  companies: any[];
  activities: any[];
  communications: any[];
}

interface MetricCard {
  title: string;
  value: string | number;
  change: number;
  icon: any;
  color: string;
}

export default function ReportsPage() {
  const [reportData, setReportData] = useState<ReportData>({
    deals: [],
    contacts: [],
    companies: [],
    activities: [],
    communications: []
  });
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30days');
  const [selectedReport, setSelectedReport] = useState('overview');

  useEffect(() => {
    loadReportData();
  }, [dateRange]);

  const loadReportData = async () => {
    setLoading(true);
    try {
      // Try to load collections that exist, handle missing gracefully
      const collections = ['deals', 'contacts', 'companies', 'activities', 'communications'];
      const results: any = {};
      
      for (const collName of collections) {
        try {
          const snapshot = await getDocs(collection(db, collName));
          results[collName] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (err) {
          console.warn(`Collection ${collName} not accessible, using empty array`);
          results[collName] = [];
        }
      }

      setReportData({
        deals: results.deals || [],
        contacts: results.contacts || [],
        companies: results.companies || [],
        activities: results.activities || [],
        communications: results.communications || []
      });
    } catch (error) {
      console.error('Error loading report data:', error);
      // Set empty data on error
      setReportData({
        deals: [],
        contacts: [],
        companies: [],
        activities: [],
        communications: []
      });
    } finally {
      setLoading(false);
    }
  };

  const getDateRange = () => {
    const now = new Date();
    let startDate = new Date();
    
    switch (dateRange) {
      case '7days':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30days':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90days':
        startDate.setDate(now.getDate() - 90);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setDate(now.getDate() - 30);
    }
    
    return { startDate, endDate: now };
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getMetrics = (): MetricCard[] => {
    const totalDeals = reportData.deals.length;
    const totalPipelineValue = reportData.deals
      .filter(deal => !['closed-won', 'closed-lost'].includes(deal.stage))
      .reduce((sum, deal) => sum + (deal.value || 0), 0);
    
    const wonDeals = reportData.deals.filter(deal => deal.stage === 'closed-won');
    const totalRevenue = wonDeals.reduce((sum, deal) => sum + (deal.value || 0), 0);
    
    const conversionRate = totalDeals > 0 ? (wonDeals.length / totalDeals) * 100 : 0;
    
    return [
      {
        title: 'Total Pipeline Value',
        value: formatCurrency(totalPipelineValue),
        change: 12.5,
        icon: DollarSign,
        color: 'blue'
      },
      {
        title: 'Revenue (Won Deals)',
        value: formatCurrency(totalRevenue),
        change: 18.2,
        icon: TrendingUp,
        color: 'green'
      },
      {
        title: 'Active Deals',
        value: totalDeals,
        change: 8.1,
        icon: Handshake,
        color: 'purple'
      },
      {
        title: 'Conversion Rate',
        value: `${conversionRate.toFixed(1)}%`,
        change: 3.4,
        icon: Target,
        color: 'orange'
      },
      {
        title: 'Total Contacts',
        value: reportData.contacts.length,
        change: 15.7,
        icon: Users,
        color: 'indigo'
      },
      {
        title: 'Active Companies',
        value: reportData.companies.length,
        change: 6.3,
        icon: Building2,
        color: 'pink'
      }
    ];
  };

  const getSalesPerformanceData = () => {
    const salesReps = ['Sarah Chen', 'Mike Johnson', 'Tom Davis', 'Lisa Wang', 'Alex Rodriguez'];
    
    return salesReps.map(rep => {
      const repDeals = reportData.deals.filter(deal => deal.owner === rep);
      const wonDeals = repDeals.filter(deal => deal.stage === 'closed-won');
      const totalValue = wonDeals.reduce((sum, deal) => sum + (deal.value || 0), 0);
      const conversionRate = repDeals.length > 0 ? (wonDeals.length / repDeals.length) * 100 : 0;
      
      return {
        name: rep,
        deals: repDeals.length,
        won: wonDeals.length,
        revenue: totalValue,
        conversionRate
      };
    });
  };

  const getActivityData = () => {
    const today = new Date();
    const last30Days = new Date();
    last30Days.setDate(today.getDate() - 30);
    
    const recentActivities = reportData.activities.filter(activity => 
      activity.createdAt && activity.createdAt.toDate() >= last30Days
    );
    
    const activityTypes = ['call', 'email', 'meeting', 'task', 'note', 'demo'];
    
    return activityTypes.map(type => {
      const count = recentActivities.filter(activity => activity.type === type).length;
      return { type, count };
    });
  };

  const getLeadSourceData = () => {
    const sources = ['Website', 'Referral', 'Cold Outreach', 'Trade Show', 'Social Media', 'Other'];
    
    return sources.map(source => {
      const count = reportData.deals.filter(deal => 
        deal.source && deal.source.toLowerCase().includes(source.toLowerCase())
      ).length;
      return { source, count };
    });
  };

  const getMonthlyTrends = () => {
    const months = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = date.toLocaleDateString('en-US', { month: 'short' });
      
      const monthDeals = reportData.deals.filter(deal => {
        if (!deal.createdAt) return false;
        const dealDate = deal.createdAt.toDate();
        return dealDate.getMonth() === date.getMonth() && 
               dealDate.getFullYear() === date.getFullYear();
      });
      
      const wonDeals = monthDeals.filter(deal => deal.stage === 'closed-won');
      const revenue = wonDeals.reduce((sum, deal) => sum + (deal.value || 0), 0);
      
      months.push({
        month: monthName,
        deals: monthDeals.length,
        revenue
      });
    }
    
    return months;
  };

  if (loading) {
    return (
      <CRMLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading reports...</div>
        </div>
      </CRMLayout>
    );
  }

  const metrics = getMetrics();
  const salesPerformance = getSalesPerformanceData();
  const activityData = getActivityData();
  const monthlyTrends = getMonthlyTrends();

  return (
    <CRMLayout>
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">CRM Reports & Analytics</h1>
            <p className="text-gray-600 mt-1">
              Comprehensive insights into your sales performance
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="90days">Last 90 Days</option>
              <option value="year">Last Year</option>
            </select>
            <button
              onClick={loadReportData}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </button>
            <button className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              <Download className="h-4 w-4 mr-2" />
              Export
            </button>
          </div>
        </div>

        {/* Report Navigation */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'overview', name: 'Overview' },
                { id: 'sales', name: 'Sales Performance' },
                { id: 'pipeline', name: 'Pipeline Analysis' },
                { id: 'activities', name: 'Activity Reports' },
                { id: 'trends', name: 'Trends & Forecasting' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedReport(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    selectedReport === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Overview Tab */}
        {selectedReport === 'overview' && (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {metrics.map((metric, index) => {
                const Icon = metric.icon;
                return (
                  <div key={index} className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`p-3 rounded-lg bg-${metric.color}-100`}>
                        <Icon className={`h-6 w-6 text-${metric.color}-600`} />
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-green-600 flex items-center">
                          <TrendingUp className="h-4 w-4 mr-1" />
                          +{metric.change}%
                        </div>
                      </div>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">{metric.value}</h3>
                    <p className="text-gray-600 text-sm mt-1">{metric.title}</p>
                  </div>
                );
              })}
            </div>

            {/* Monthly Trends Chart */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Monthly Performance</h3>
              <div className="space-y-4">
                {monthlyTrends.map((month, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <div className="w-12 text-sm font-medium text-gray-600">{month.month}</div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{month.deals} deals</div>
                        <div className="text-xs text-gray-500">{formatCurrency(month.revenue)} revenue</div>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <div className="w-32 bg-gray-200 rounded-full h-2 mr-4">
                        <div 
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: `${(month.deals / Math.max(...monthlyTrends.map(m => m.deals))) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-900">{month.deals}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Sales Performance Tab */}
        {selectedReport === 'sales' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Sales Rep Performance</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left pb-3 text-sm font-medium text-gray-500">Sales Rep</th>
                      <th className="text-left pb-3 text-sm font-medium text-gray-500">Total Deals</th>
                      <th className="text-left pb-3 text-sm font-medium text-gray-500">Won Deals</th>
                      <th className="text-left pb-3 text-sm font-medium text-gray-500">Revenue</th>
                      <th className="text-left pb-3 text-sm font-medium text-gray-500">Conversion Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salesPerformance.map((rep, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="py-3 font-medium text-gray-900">{rep.name}</td>
                        <td className="py-3 text-gray-600">{rep.deals}</td>
                        <td className="py-3 text-gray-600">{rep.won}</td>
                        <td className="py-3 font-medium text-gray-900">{formatCurrency(rep.revenue)}</td>
                        <td className="py-3">
                          <div className="flex items-center">
                            <div className="w-20 bg-gray-200 rounded-full h-2 mr-2">
                              <div 
                                className={`h-2 rounded-full ${
                                  rep.conversionRate >= 30 ? 'bg-green-500' :
                                  rep.conversionRate >= 15 ? 'bg-yellow-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${Math.min(rep.conversionRate, 100)}%` }}
                              />
                            </div>
                            <span className="text-sm">{rep.conversionRate.toFixed(1)}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Activities Tab */}
        {selectedReport === 'activities' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Activity Breakdown (Last 30 Days)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activityData.map((activity, index) => {
                  const icons = {
                    call: Phone,
                    email: Mail,
                    meeting: Users,
                    task: CheckCircle2,
                    note: MessageSquare,
                    demo: Handshake
                  };
                  const Icon = icons[activity.type as keyof typeof icons] || CheckCircle2;
                  
                  return (
                    <div key={index} className="flex items-center p-4 bg-gray-50 rounded-lg">
                      <div className="p-2 bg-blue-100 rounded-lg mr-4">
                        <Icon className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="text-lg font-semibold text-gray-900">{activity.count}</div>
                        <div className="text-sm text-gray-600 capitalize">{activity.type}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Communication Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-6 bg-blue-50 rounded-lg">
                  <Mail className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900">{reportData.communications.filter(c => c.type === 'email').length}</div>
                  <div className="text-sm text-gray-600">Emails</div>
                </div>
                <div className="text-center p-6 bg-green-50 rounded-lg">
                  <Phone className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900">{reportData.communications.filter(c => c.type === 'call').length}</div>
                  <div className="text-sm text-gray-600">Calls</div>
                </div>
                <div className="text-center p-6 bg-purple-50 rounded-lg">
                  <MessageSquare className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900">{reportData.communications.filter(c => c.type === 'meeting').length}</div>
                  <div className="text-sm text-gray-600">Meetings</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Pipeline Tab */}
        {selectedReport === 'pipeline' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Pipeline by Stage</h3>
              <div className="space-y-4">
                {['qualification', 'demo', 'proposal', 'negotiation', 'closed-won', 'closed-lost'].map((stage) => {
                  const stageDeals = reportData.deals.filter(deal => deal.stage === stage);
                  const stageValue = stageDeals.reduce((sum, deal) => sum + (deal.value || 0), 0);
                  const totalValue = reportData.deals.reduce((sum, deal) => sum + (deal.value || 0), 0);
                  const percentage = totalValue > 0 ? (stageValue / totalValue) * 100 : 0;
                  
                  const stageNames: { [key: string]: string } = {
                    'qualification': 'Qualification',
                    'demo': 'Demo',
                    'proposal': 'Proposal', 
                    'negotiation': 'Negotiation',
                    'closed-won': 'Closed Won',
                    'closed-lost': 'Closed Lost'
                  };
                  
                  return (
                    <div key={stage} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <div className={`w-4 h-4 rounded-full mr-3 ${
                          stage === 'closed-won' ? 'bg-green-500' :
                          stage === 'closed-lost' ? 'bg-red-500' :
                          stage === 'negotiation' ? 'bg-purple-500' :
                          stage === 'proposal' ? 'bg-yellow-500' :
                          stage === 'demo' ? 'bg-blue-500' : 'bg-gray-500'
                        }`}></div>
                        <span className="font-medium">{stageNames[stage]}</span>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className="text-sm text-gray-600">{stageDeals.length} deals</span>
                        <span className="font-medium">{formatCurrency(stageValue)}</span>
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              stage === 'closed-won' ? 'bg-green-500' :
                              stage === 'closed-lost' ? 'bg-red-500' :
                              stage === 'negotiation' ? 'bg-purple-500' :
                              stage === 'proposal' ? 'bg-yellow-500' :
                              stage === 'demo' ? 'bg-blue-500' : 'bg-gray-500'
                            }`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-500 w-12">{percentage.toFixed(1)}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Trends Tab */}
        {selectedReport === 'trends' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Key Insights</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-start p-4 bg-green-50 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-green-600 mt-1 mr-3" />
                    <div>
                      <div className="font-medium text-green-900">Pipeline Growing</div>
                      <div className="text-sm text-green-700">Total pipeline value increased by 12.5% this month</div>
                    </div>
                  </div>
                  <div className="flex items-start p-4 bg-blue-50 rounded-lg">
                    <Target className="h-5 w-5 text-blue-600 mt-1 mr-3" />
                    <div>
                      <div className="font-medium text-blue-900">Conversion Improving</div>
                      <div className="text-sm text-blue-700">Deal conversion rate up 3.4% from last period</div>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start p-4 bg-yellow-50 rounded-lg">
                    <Calendar className="h-5 w-5 text-yellow-600 mt-1 mr-3" />
                    <div>
                      <div className="font-medium text-yellow-900">Activity Increase</div>
                      <div className="text-sm text-yellow-700">Sales activities up 15.7% compared to last month</div>
                    </div>
                  </div>
                  <div className="flex items-start p-4 bg-purple-50 rounded-lg">
                    <Users className="h-5 w-5 text-purple-600 mt-1 mr-3" />
                    <div>
                      <div className="font-medium text-purple-900">New Contacts</div>
                      <div className="text-sm text-purple-700">Added {reportData.contacts.length} new contacts this period</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Forecast Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-6 border border-gray-200 rounded-lg">
                  <div className="text-3xl font-bold text-gray-900">
                    {formatCurrency(
                      reportData.deals
                        .filter(deal => deal.stage === 'negotiation')
                        .reduce((sum, deal) => sum + (deal.value || 0), 0)
                    )}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">Expected to Close</div>
                  <div className="text-xs text-gray-500">Next 30 days</div>
                </div>
                <div className="text-center p-6 border border-gray-200 rounded-lg">
                  <div className="text-3xl font-bold text-gray-900">
                    {Math.round(
                      reportData.deals
                        .filter(deal => !['closed-won', 'closed-lost'].includes(deal.stage))
                        .reduce((sum, deal) => sum + ((deal.value || 0) * (deal.probability || 0) / 100), 0)
                    )}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">Weighted Pipeline</div>
                  <div className="text-xs text-gray-500">Based on probability</div>
                </div>
                <div className="text-center p-6 border border-gray-200 rounded-lg">
                  <div className="text-3xl font-bold text-gray-900">
                    {reportData.deals.filter(deal => {
                      const closeDate = new Date(deal.closeDate);
                      const now = new Date();
                      const nextMonth = new Date();
                      nextMonth.setMonth(now.getMonth() + 1);
                      return closeDate >= now && closeDate <= nextMonth && 
                             !['closed-won', 'closed-lost'].includes(deal.stage);
                    }).length}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">Deals Closing</div>
                  <div className="text-xs text-gray-500">This month</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </CRMLayout>
  );
}