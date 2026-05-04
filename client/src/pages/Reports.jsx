import { useEffect, useState } from 'react';
import {
  getReportsCategory,
  getReportsArea,
  getReportsHighPriority,
  getReportsMonthlyTrend,
  getReportsHotspots,
  getReportsStatus,
  getReportsPriority
} from '../services/api';

const Reports = () => {
  const [categoryData, setCategoryData] = useState([]);
  const [areaData, setAreaData] = useState([]);
  const [highPriorityData, setHighPriorityData] = useState(null);
  const [monthlyTrend, setMonthlyTrend] = useState([]);
  const [hotspots, setHotspots] = useState([]);
  const [statusData, setStatusData] = useState([]);
  const [priorityData, setPriorityData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAllReports();
  }, []);

  const fetchAllReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const [catRes, areaRes, hpRes, trendRes, hotRes, statusRes, priRes] = await Promise.all([
        getReportsCategory(),
        getReportsArea(),
        getReportsHighPriority(),
        getReportsMonthlyTrend(),
        getReportsHotspots(),
        getReportsStatus(),
        getReportsPriority()
      ]);

      setCategoryData(catRes.data.data);
      setAreaData(areaRes.data.data);
      setHighPriorityData(hpRes.data.data);
      setMonthlyTrend(trendRes.data.data);
      setHotspots(hotRes.data.data);
      setStatusData(statusRes.data.data);
      setPriorityData(priRes.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const totalComplaints = categoryData.reduce((sum, item) => sum + item.count, 0);
  const totalHighPriority = highPriorityData?.highPriorityCount || 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 p-8 rounded-xl text-center">
          <p className="text-2xl mb-2">⚠️</p>
          <p>{error}</p>
          <button onClick={fetchAllReports} className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">MongoDB Aggregation Reports</h1>
        <p className="text-slate-600">NoSQL query results and pipeline outputs</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="text-3xl font-bold text-blue-600">{totalComplaints}</div>
          <div className="text-sm text-slate-600">Total Complaints</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="text-3xl font-bold text-red-600">{totalHighPriority}</div>
          <div className="text-sm text-slate-600">High Priority</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="text-3xl font-bold text-emerald-600">{categoryData.length}</div>
          <div className="text-sm text-slate-600">Categories</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="text-3xl font-bold text-purple-600">{areaData.length}</div>
          <div className="text-sm text-slate-600">Areas</div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* Complaints by Category */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">1. Complaints per Category (Aggregation)</h3>
          <div className="space-y-3">
            {categoryData.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <span className="font-medium text-slate-700">{item._id}</span>
                <span className="text-lg font-bold text-blue-600">{item.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Complaints by Status */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">2. Complaints per Status (Aggregation)</h3>
          <div className="space-y-3">
            {statusData.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <span className="font-medium text-slate-700 capitalize">{item._id.replace('_', ' ')}</span>
                <span className="text-lg font-bold text-green-600">{item.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Complaints by Priority */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">3. Complaints per Priority (Aggregation)</h3>
          <div className="space-y-3">
            {priorityData.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <span className="font-medium text-slate-700 capitalize">{item._id}</span>
                <span className="text-lg font-bold text-purple-600">{item.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* High Priority Count */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">4. High Priority Complaints (Aggregation)</h3>
          <div className="p-6 bg-red-50 rounded-lg text-center">
            <div className="text-5xl font-bold text-red-600 mb-2">{totalHighPriority}</div>
            <p className="text-sm text-slate-600">High priority complaints requiring immediate attention</p>
          </div>
        </div>
      </div>

      {/* Monthly Trend */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">5. Monthly Trend (Aggregation Pipeline)</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-4 font-semibold text-slate-700">Month</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-700">Complaints</th>
              </tr>
            </thead>
            <tbody>
              {monthlyTrend.map((item, idx) => (
                <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-3 px-4 text-slate-700">{item._id}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-slate-200 rounded-full h-3 overflow-hidden">
                        <div
                          className="h-full bg-blue-600 rounded-full"
                          style={{ width: `${Math.min((item.count / Math.max(...monthlyTrend.map(d => d.count))) * 100, 100)}%` }}
                        ></div>
                      </div>
                      <span className="font-semibold text-slate-800 w-8">{item.count}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top 5 Hotspot Areas */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">6. Top 5 Hotspot Areas (Aggregation Pipeline)</h3>
        {hotspots.length > 0 ? (
          <div className="space-y-4">
            {hotspots.map((area, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:border-blue-300">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold ${
                    idx === 0 ? 'bg-yellow-100 text-yellow-700' :
                    idx === 1 ? 'bg-slate-100 text-slate-600' :
                    idx === 2 ? 'bg-orange-100 text-orange-700' : 'bg-slate-50 text-slate-500'
                  }`}>
                    #{idx + 1}
                  </div>
                  <div>
                    <div className="font-semibold text-slate-800">{area._id}</div>
                    <div className="text-sm text-slate-500">
                      {area.complaintCount} complaints
                      {area.highPriorityCount > 0 && ` • ${area.highPriorityCount} high priority`}
                    </div>
                  </div>
                </div>
                <div className="w-32 h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-500 rounded-full"
                    style={{ width: `${(area.complaintCount / hotspots[0].complaintCount) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-500 text-center py-8">No area data available</p>
        )}
      </div>

      {/* Query Info */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">MongoDB Aggregation Pipelines Used</h3>
        <div className="grid md:grid-cols-2 gap-4 text-sm text-blue-800">
          <div>
            <p><strong>Category Report:</strong> $group by category</p>
            <p><strong>Area Report:</strong> $match + $group by location.areaName</p>
            <p><strong>High Priority:</strong> $match + $group with $sum</p>
          </div>
          <div>
            <p><strong>Monthly Trend:</strong> $dateToString + $group</p>
            <p><strong>Hotspots:</strong> $group + $sort + $limit (top 5)</p>
            <p><strong>Status/Priority:</strong> Simple $group aggregations</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
