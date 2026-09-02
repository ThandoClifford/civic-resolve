import { Link } from 'react-router-dom';
import IssueMapPanel from '../components/IssueMapPanel';

const Landing = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-slate-800 to-blue-900">
      <div className="max-w-7xl mx-auto px-4 py-20">
        <div className="text-center text-white mb-16">
          <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full text-sm text-blue-200 mb-6">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            CivicResolve
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            Intelligent Municipal Service Reporting
            <span className="block text-blue-300">and Response Platform</span>
          </h1>
          <p className="text-xl text-blue-200 mb-10 max-w-2xl mx-auto">
            Report community service issues and help municipal teams track, review, and respond to them.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              to="/submit"
              className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 px-8 py-4 rounded-xl text-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-blue-600/25"
            >
              Report an Issue
              <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </Link>
            <Link
              to="/complaints"
              className="inline-flex items-center justify-center bg-white/10 border border-white/20 hover:bg-white/20 px-8 py-4 rounded-xl text-lg font-semibold transition-all duration-200"
            >
              View Issues
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mt-16">
          <div className="group bg-white/10 hover:bg-white/15 p-8 rounded-2xl border border-white/10 transition-all duration-300">
            <div className="w-14 h-14 bg-blue-500/20 rounded-xl flex items-center justify-center text-3xl mb-5">
              📝
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Report Issues</h3>
            <p className="text-blue-200">
              Capture issue details, location context, and supporting information for municipal review.
            </p>
          </div>

          <div className="group bg-white/10 hover:bg-white/15 p-8 rounded-2xl border border-white/10 transition-all duration-300">
            <div className="w-14 h-14 bg-emerald-500/20 rounded-xl flex items-center justify-center text-3xl mb-5">
              🔄
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Track Progress</h3>
            <p className="text-blue-200">
              Add updates and follow the status of each issue as it moves through response stages.
            </p>
          </div>

          <div className="group bg-white/10 hover:bg-white/15 p-8 rounded-2xl border border-white/10 transition-all duration-300">
            <div className="w-14 h-14 bg-purple-500/20 rounded-xl flex items-center justify-center text-3xl mb-5">
              📊
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Review Analytics</h3>
            <p className="text-blue-200">
              Monitor reporting patterns and response activity through the available analytics views.
            </p>
          </div>
        </div>

        <div className="mt-16 bg-white/5 border border-white/10 rounded-[2rem] p-4 md:p-6 backdrop-blur-sm">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-blue-200/80 mb-2">Live focus area</p>
              <h2 className="text-3xl font-bold text-white">Issue locations across the city</h2>
              <p className="text-blue-200 mt-2 max-w-2xl">
                Every user can see the current issue map right on the home page, with marker colors based on priority.
              </p>
            </div>
            <Link
              to="/issue-map"
              className="inline-flex items-center justify-center bg-white text-slate-900 hover:bg-blue-50 px-5 py-3 rounded-xl font-semibold transition-colors"
            >
              Open full map
            </Link>
          </div>

          <IssueMapPanel compact />
        </div>
      </div>
    </div>
  );
};

export default Landing;
