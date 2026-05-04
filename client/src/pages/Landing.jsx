import { Link } from 'react-router-dom';

const Landing = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-slate-800 to-blue-900">
      <div className="max-w-7xl mx-auto px-4 py-20">
        <div className="text-center text-white mb-16">
          <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full text-sm text-blue-200 mb-6">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            MongoDB NoSQL Demo
          </div>
<h2>Login Feature Branch</h2>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            Illegal Dumping
            <span className="block text-blue-300">Complaint Tracker</span>
          </h1>

          <p className="text-xl text-blue-200 mb-10 max-w-2xl mx-auto">
            A focused MongoDB application demonstrating embedded documents, arrays,
            and aggregation pipelines for managing municipal complaints.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              to="/submit"
              className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 px-8 py-4 rounded-xl text-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-blue-600/25"
            >
              Submit Complaint
              <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </Link>
            <Link
              to="/complaints"
              className="inline-flex items-center justify-center bg-white/10 border border-white/20 hover:bg-white/20 px-8 py-4 rounded-xl text-lg font-semibold transition-all duration-200"
            >
              View Complaints
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mt-16">
          <div className="group bg-white/10 hover:bg-white/15 p-8 rounded-2xl border border-white/10 transition-all duration-300">
            <div className="w-14 h-14 bg-blue-500/20 rounded-xl flex items-center justify-center text-3xl mb-5">
              📝
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Create Complaints</h3>
            <p className="text-blue-200">
              Submit complaints with embedded location data, category, priority, and image URLs.
            </p>
          </div>

          <div className="group bg-white/10 hover:bg-white/15 p-8 rounded-2xl border border-white/10 transition-all duration-300">
            <div className="w-14 h-14 bg-emerald-500/20 rounded-xl flex items-center justify-center text-3xl mb-5">
              🔄
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Track Progress</h3>
            <p className="text-blue-200">
              Add status updates and view the complete history of each complaint.
            </p>
          </div>

          <div className="group bg-white/10 hover:bg-white/15 p-8 rounded-2xl border border-white/10 transition-all duration-300">
            <div className="w-14 h-14 bg-purple-500/20 rounded-xl flex items-center justify-center text-3xl mb-5">
              📊
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Aggregation Reports</h3>
            <p className="text-blue-200">
              View MongoDB aggregation pipeline results for analytics and insights.
            </p>
          </div>
        </div>

        <div className="mt-20 bg-white/5 p-8 rounded-2xl border border-white/10">
          <h2 className="text-2xl font-bold text-white text-center mb-6">MongoDB Features Demonstrated</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: 'Embedded Documents', icon: '📄' },
              { name: 'Arrays of Subdocs', icon: '📚' },
              { name: 'Geospatial Index', icon: '🗺️' },
              { name: 'Aggregation Pipe', icon: '🔄' },
              { name: 'Text Search', icon: '🔍' },
              { name: 'Array Updates', icon: '➕' },
              { name: 'Complex Queries', icon: '⚡' },
              { name: 'Indexing', icon: '🚀' }
            ].map((feat) => (
              <div key={feat.name} className="bg-white/5 hover:bg-white/10 p-4 rounded-xl text-center border border-white/5 transition-all">
                <div className="text-2xl mb-2">{feat.icon}</div>
                <div className="text-sm text-blue-200 font-medium">{feat.name}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Landing;
