import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Landing from './pages/Landing';
import SubmitComplaint from './pages/SubmitComplaint';
import ViewComplaints from './pages/ViewComplaints';
import Reports from './pages/Reports';

const App = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/submit" element={<SubmitComplaint />} />
        <Route path="/complaints" element={<ViewComplaints />} />
        <Route path="/reports" element={<Reports />} />
      </Routes>
    </div>
  );
};

export default App;
