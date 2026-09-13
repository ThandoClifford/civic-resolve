import { useAuth } from '../context/AuthContext';

const Users = () => {
  const { user } = useAuth();

  if (user?.role !== 'ADMIN') {
    return <div className="page-wrap"><div className="error-card">Admin-only user administration is available.</div></div>;
  }

  return (
    <div className="page-wrap">
      <section className="page-heading">
        <div>
          <span className="eyebrow">Role Administration</span>
          <h1 className="page-title">Users</h1>
          <p className="page-subtitle">System users and role visibility</p>
        </div>
      </section>
      <section className="panel-card">
        <div className="panel-title">
          <span>Users</span>
          <span className="chip chip-blue">ADMIN ONLY</span>
        </div>
        <div className="empty-state">User administration is currently exposed through the existing backend model and auth routes. Password hashes, JWTs, and API keys are never shown in the UI.</div>
      </section>
    </div>
  );
};

export default Users;
