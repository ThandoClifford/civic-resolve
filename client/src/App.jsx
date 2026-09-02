import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Landing from './pages/Landing';
import SubmitComplaint from './pages/SubmitComplaint';
import ViewComplaints from './pages/ViewComplaints';
import Reports from './pages/Reports';
import Login from './pages/Login';
import Register from './pages/Register';
import IssueMap from './pages/IssueMap';
import SmartLightDashboard from './pages/SmartLightDashboard';

const App = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/submit" element={<SubmitComplaint />} />
        <Route path="/complaints" element={<ViewComplaints />} />
        <Route path="/issue-map" element={<IssueMap />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/smartlight" element={<SmartLightDashboard />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    </div>
  );
};

export default App;
