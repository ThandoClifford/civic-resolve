import { useAuth } from '../context/AuthContext';

const Settings = () => {
  const { user } = useAuth();

  return (
    <div className="page-wrap">
      <section className="page-heading">
        <div>
          <span className="eyebrow">System Settings</span>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Configurable server-backed selections</p>
        </div>
      </section>
      <section className="panel-card">
        <div className="panel-title">
          <span>Available Settings</span>
          <span className="chip chip-gray">{user?.role || 'Guest'}</span>
        </div>
        <div className="empty-state">No persistent system settings are implemented in the current backend. The safest present-day settings surface is the operating mode used by the SmartLight demo route.</div>
      </section>
    </div>
  );
};

export default Settings;
