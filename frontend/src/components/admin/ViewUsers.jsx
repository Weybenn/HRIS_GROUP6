import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ArrowLeft, Eye, UserPen, Eraser } from 'lucide-react';
import UpdateUserModal from '../modals/UpdateUserModal';
import ResetPasswordModal from '../modals/ResetPasswordModal';
import ViewUserModal from '../modals/ViewUserModal';

const poppins = {
  fontFamily: 'Poppins, sans-serif',
};

const statusCircle = (status) => (
  <span
    style={{
      display: 'inline-block',
      width: 16,
      height: 16,
      borderRadius: '50%',
      background: status === 'active' ? 'green' : 'grey',
      verticalAlign: 'middle',
    }}
  />
);

const ViewUsers = () => {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [updateUser, setUpdateUser] = useState(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [resetUser, setResetUser] = useState(null);
  const [showResetModal, setShowResetModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/users`);
        const data = await res.json();
        setUsers(data);
        setError(null);
      } catch (err) {
        setError('Failed to fetch users');
      }
      setLoading(false);
    };
    fetchUsers();
  }, []);

  const displayedUsers = useMemo(() => {
    const q = (search || '').toString().trim().toLowerCase();
    if (!q) return users;
    return users.filter(u => {
      const name = `${u.first_name} ${u.middle_name && u.middle_name !== 'NA' ? u.middle_name + ' ' : ''}${u.last_name}`.toLowerCase();
      const pos = (u.position || '').toLowerCase();
      return name.includes(q) || pos.includes(q);
    });
  }, [users, search]);

  const openUser = async (id) => {
    try {
      const res = await fetch(`/api/users/${id}`);
      const data = await res.json();
      setSelectedUser(data);
      setIsModalOpen(true);
    } catch (e) {
      setError('Failed to load user details');
    }
  };
  
  const openUpdate = async (id) => {
    try {
      const res = await fetch(`/api/users/${id}`);
      const data = await res.json();
      setUpdateUser(data);
      setShowUpdateModal(true);
    } catch (e) {
      setError('Failed to load user for update');
    }
  };

  const openReset = async (id) => {
    try {
      const res = await fetch(`/api/users/${id}`);
      const data = await res.json();
      setResetUser(data);
      setShowResetModal(true);
    } catch (e) {
      setError('Failed to load user for password reset');
    }
  };

  return (
    <div style={{ ...poppins, minHeight: '100vh', padding: '0 2rem 2rem 2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
        <button
          onClick={() => navigate('/dashboard_admin/settings')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', marginRight: 16 }}
          aria-label="Back to settings"
        >
          <ArrowLeft color="#6D2323" size={32} />
        </button>
        <h2 style={{ color: '#6D2323', fontWeight: 700, fontSize: 32, margin: 0 }}>User Settings</h2>
      </div>
      <div style={{ display: 'flex', justifyContent: 'left', marginBottom: 32 }}>
        <div style={{ width: '100%', maxWidth: 720 }}>
          <label htmlFor="users-search" style={{ display: 'block', marginBottom: 8, color: '#6D2323', fontWeight: 600 }}>Find a user</label>
          <div style={{ display: 'flex', alignItems: 'center', border: '2px solid #6D2323', borderRadius: 8, padding: '8px 12px' }}>
            <input
              id="users-search"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name..."
              style={{ flex: 1, border: 'none', outline: 'none', fontSize: 16, color: '#6D2323' }}
            />
            <Search size={20} color="#6D2323" />
          </div>
        </div>
      </div>
      <div style={{ background: '#FFFFFF', borderRadius: 8, border: '1px solid #e9ecef', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'Poppins, sans-serif' }}>
            <thead>
              <tr style={{ background: '#6D2323', color: '#FFFFFF', fontWeight: 600, fontSize: 20, borderBottom: '1px solid #e9ecef' }}>
                <th style={{ padding: '16px 12px', textAlign: 'left' }}>User</th>
                <th style={{ padding: '16px 12px', textAlign: 'center' }}>Position</th>
                <th style={{ padding: '16px 12px', textAlign: 'center' }}>Status</th>
                <th style={{ padding: '16px 12px', textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} style={{ textAlign: 'center', padding: 32 }}>Loading...</td></tr>
              ) : error ? (
                <tr><td colSpan={4} style={{ textAlign: 'center', padding: 32, color: 'red' }}>{error}</td></tr>
              ) : displayedUsers.length === 0 ? (
                <tr><td colSpan={4} style={{ textAlign: 'center', padding: 32, color: '#6D2323', fontWeight: 500, fontSize: 22 }}>No result found.</td></tr>
              ) : (
                displayedUsers.map((user, idx) => (
                  <tr key={user.id} style={{ color: '#000000', fontWeight: 400, fontSize: 18, borderBottom: '1px solid #e9ecef' }}>
                    <td style={{ padding: '12px 12px', textAlign: 'left' }}>
                      <div style={{ fontWeight: 600 }}>
                        {user.first_name} {user.middle_name && user.middle_name !== 'NA' ? user.middle_name + ' ' : ''}{user.last_name}
                      </div>
                    </td>
                    <td style={{ padding: '12px 12px', textAlign: 'center' }}>{user.position.charAt(0).toUpperCase() + user.position.slice(1)}</td>
                    <td style={{ padding: '12px 12px', textAlign: 'center' }}>{statusCircle(user.status)}</td>
                    <td style={{ padding: '12px 12px', textAlign: 'center', verticalAlign: 'middle' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, height: '100%' }}>
                        <Eye onClick={() => openUser(user.id)} color="#007BFF" size={22} style={{ cursor: 'pointer' }} />
                        <UserPen onClick={() => openUpdate(user.id)} color="#28A745" size={22} style={{ cursor: 'pointer' }} />
                        <Eraser onClick={() => openReset(user.id)} color="#DC3545" size={22} style={{ cursor: 'pointer' }} />                      
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      <ViewUserModal open={isModalOpen} onClose={() => setIsModalOpen(false)} user={selectedUser} />
      <UpdateUserModal open={showUpdateModal} onClose={() => setShowUpdateModal(false)} user={updateUser} onUpdated={() => {
        setShowUpdateModal(false);
        setUpdateUser(null);
        fetch(`/api/users`).then(r => r.json()).then(setUsers).catch(() => {});
      }} />
      <ResetPasswordModal 
        open={showResetModal} 
        onClose={() => {
          setShowResetModal(false);
          setResetUser(null);
        }} 
        user={resetUser} 
        onReset={() => {
        }} 
      />    
    </div>
  );
};

export default ViewUsers;
