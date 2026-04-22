import { Link } from 'react-router-dom';

const Landing = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-7xl mx-auto px-4 py-20">
        <div className="text-center text-white mb-16">
          <div className="inline-flex items-center gap-2 bg-slate-800/50 px-4 py-2 rounded-full text-sm text-slate-300 mb-6">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            Municipal Issue Management System
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            Smart Public Complaints
            <span className="block text-blue-400">&</span>
            Municipal Management
          </h1>
          
          <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto">
            Report issues, track complaints, and help improve your community. 
            Together we can make our city cleaner and safer.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              to="/register"
              className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 px-8 py-4 rounded-xl text-lg font-semibold transition-all duration-200 hover:shadow-lg hover:shadow-blue-600/25"
            >
              Get Started
              <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center justify-center bg-slate-800/50 border border-slate-600 hover:bg-slate-700 px-8 py-4 rounded-xl text-lg font-semibold transition-all duration-200"
            >
              Sign In
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mt-20">
          <div className="group bg-slate-800/30 hover:bg-slate-800/50 p-8 rounded-2xl border border-slate-700/50 transition-all duration-300">
            <div className="w-14 h-14 bg-blue-600/20 rounded-xl flex items-center justify-center text-3xl mb-5 group-hover:scale-110 transition-transform duration-300">
              📢
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Report Issues</h3>
            <p className="text-slate-400">
              Submit complaints about illegal dumping, road damage, water leaks, and more. Attach photos to provide clear evidence.
            </p>
          </div>
          
          <div className="group bg-slate-800/30 hover:bg-slate-800/50 p-8 rounded-2xl border border-slate-700/50 transition-all duration-300">
            <div className="w-14 h-14 bg-red-600/20 rounded-xl flex items-center justify-center text-3xl mb-5 group-hover:scale-110 transition-transform duration-300">
              🗺️
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Hotspot Mapping</h3>
            <p className="text-slate-400">
              View illegal dumping hotspots on an interactive map. Identify problem areas and track high-risk zones.
            </p>
          </div>
          
          <div className="group bg-slate-800/30 hover:bg-slate-800/50 p-8 rounded-2xl border border-slate-700/50 transition-all duration-300">
            <div className="w-14 h-14 bg-emerald-600/20 rounded-xl flex items-center justify-center text-3xl mb-5 group-hover:scale-110 transition-transform duration-300">
              📊
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Analytics Dashboard</h3>
            <p className="text-slate-400">
              Track issue trends, resolution times, and get insights for better municipal management decisions.
            </p>
          </div>
        </div>

        <div className="mt-20 bg-slate-800/20 p-8 rounded-2xl border border-slate-700/30">
          <h2 className="text-2xl font-bold text-white text-center mb-8">Complaint Categories</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { name: 'Illegal Dumping', icon: '🗑️', color: 'red' },
              { name: 'Water Leak', icon: '💧', color: 'blue' },
              { name: 'Road Damage', icon: '🛣️', color: 'slate' },
              { name: 'Electricity Fault', icon: '⚡', color: 'yellow' },
              { name: 'Other', icon: '📋', color: 'gray' }
            ].map((cat) => (
              <div key={cat.name} className="bg-slate-800/40 hover:bg-slate-800/60 p-5 rounded-xl text-center border border-slate-700/30 transition-all duration-200 hover:scale-105">
                <div className="text-3xl mb-2">{cat.icon}</div>
                <div className="text-slate-200 font-medium">{cat.name}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-20 text-center">
          <div className="inline-flex items-center gap-6 text-slate-400 text-sm">
            <span>Trusted by municipalities</span>
            <span className="w-1 h-1 bg-slate-600 rounded-full"></span>
            <span>Secure & Private</span>
            <span className="w-1 h-1 bg-slate-600 rounded-full"></span>
            <span>Real-time Updates</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Landing;