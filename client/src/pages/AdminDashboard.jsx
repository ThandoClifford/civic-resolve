import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import api from '../services/api';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

const AdminDashboard = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/analytics/summary');
      setSummary(response.data.summary);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner w-12 h-12"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="page-header">
          <h1 className="page-title">Admin Dashboard</h1>
          <p className="page-subtitle">Analytics and complaint overview</p>
        </div>
        <div className="card p-12">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">Error Loading Dashboard</h3>
            <p className="text-slate-500 mb-4">{error}</p>
            <button onClick={fetchSummary} className="btn btn-primary">
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const categoryData = {
    labels: Object.keys(summary?.byCategory || {}),
    datasets: [{
      data: Object.values(summary?.byCategory || {}),
      backgroundColor: ['#ef4444', '#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6']
    }]
  };

  const statusData = {
    labels: Object.keys(summary?.byStatus || {}).map(s => s.replace('_', ' ')),
    datasets: [{
      data: Object.values(summary?.byStatus || {}),
      backgroundColor: ['#f59e0b', '#3b82f6', '#f97316', '#22c55e']
    }]
  };

  const priorityData = {
    labels: Object.keys(summary?.byPriority || {}).map(p => p.charAt(0).toUpperCase() + p.slice(1)),
    datasets: [{
      data: Object.values(summary?.byPriority || {}),
      backgroundColor: ['#22c55e', '#f59e0b', '#ef4444']
    }]
  };

  const trendData = {
    labels: summary?.monthlyTrend?.slice(-7).map(t => t._id) || [],
    datasets: [{
      label: 'Complaints',
      data: summary?.monthlyTrend?.slice(-7).map(t => t.count) || [],
      backgroundColor: '#3b82f6'
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 20,
          usePointStyle: true
        }
      }
    }
  };

  const statCards = [
    {
      label: 'Total Complaints',
      value: summary?.totalComplaints || 0,
      icon: '📋',
      color: 'blue'
    },
    {
      label: 'Pending',
      value: summary?.pending || 0,
      icon: '⏳',
      color: 'amber'
    },
    {
      label: 'In Progress',
      value: summary?.inProgress || 0,
      icon: '🔄',
      color: 'orange'
    },
    {
      label: 'Resolved',
      value: summary?.resolved || 0,
      icon: '✅',
      color: 'emerald'
    }
  ];

  const statCardsRow2 = [
    {
      label: 'Resolution Rate',
      value: `${summary?.resolutionRate || 0}%`,
      icon: '📈',
      color: 'violet'
    },
    {
      label: 'Illegal Dumping',
      value: summary?.illegalDumpingCount || 0,
      icon: '🗑️',
      color: 'red'
    },
    {
      label: 'Avg Days to Resolve',
      value: summary?.avgResolutionTime || 0,
      icon: '⏱️',
      color: 'slate'
    },
    {
      label: 'Unresolved',
      value: summary?.unresolved || 0,
      icon: '⚠️',
      color: 'rose'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="page-header flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="page-title">Admin Dashboard</h1>
          <p className="page-subtitle">Analytics and complaint overview</p>
        </div>
        <div className="flex gap-3 mt-4 md:mt-0">
          <button 
            onClick={fetchSummary}
            className="btn btn-secondary flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.582 0a8.002 8.002 0 011.582 0M4 20h16m-8-8V4m0 0L12 8m4-4l4 4" />
            </svg>
            Refresh
          </button>
          <Link to="/admin/complaints" className="btn btn-primary">
            Manage Complaints
          </Link>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-4 mb-4">
        {statCards.map((stat, index) => (
          <div key={index} className="stat-card group hover:border-slate-300">
            <div className="flex items-center gap-4">
              <div className={`stat-card-icon bg-${stat.color}-100`}>
                {stat.icon}
              </div>
              <div>
                <div className={`stat-card-value text-${stat.color}-600`}>{stat.value}</div>
                <div className="stat-card-label">{stat.label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-4 gap-4 mb-8">
        {statCardsRow2.map((stat, index) => (
          <div key={index} className="stat-card group hover:border-slate-300">
            <div className="flex items-center gap-4">
              <div className={`stat-card-icon bg-${stat.color}-100`}>
                {stat.icon}
              </div>
              <div>
                <div className={`stat-card-value text-${stat.color}-600`}>{stat.value}</div>
                <div className="stat-card-label">{stat.label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-slate-800">Complaints by Category</h3>
          </div>
          <div className="card-body h-72">
            <Doughnut data={categoryData} options={chartOptions} />
          </div>
        </div>
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-slate-800">Complaints by Status</h3>
          </div>
          <div className="card-body h-72">
            <Doughnut data={statusData} options={chartOptions} />
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-slate-800">Complaints by Priority</h3>
          </div>
          <div className="card-body h-72">
            <Doughnut data={priorityData} options={chartOptions} />
          </div>
        </div>
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-slate-800">Weekly Trend</h3>
          </div>
          <div className="card-body h-72">
            <Bar 
              data={trendData} 
              options={{
                ...chartOptions,
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      stepSize: 1
                    }
                  }
                }
              }} 
            />
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold text-slate-800">Top Affected Areas</h3>
          <p className="text-sm text-slate-500">Areas with highest complaint volume</p>
        </div>
        {summary?.topAreas?.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {summary.topAreas.map((area, index) => (
              <div 
                key={index} 
                className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-sm font-medium text-slate-600">
                    {index + 1}
                  </div>
                  <span className="font-medium text-slate-800">
                    {area._id || 'Unknown'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 text-sm">
                    {area.count} {area.count === 1 ? 'complaint' : 'complaints'}
                  </span>
                  <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-600 rounded-full"
                      style={{ 
                        width: `${(area.count / summary.topAreas[0].count) * 100}%` 
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-slate-500">
            No data available
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;