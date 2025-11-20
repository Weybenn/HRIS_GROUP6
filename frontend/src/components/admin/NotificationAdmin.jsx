import { useEffect, useState } from 'react';
import { Trash2, Bell, X, Clock, Info, AlertCircle, CheckCircle, User, Check, Mail, CheckSquare, Square } from 'lucide-react';
import ResetPasswordModal from '../modals/ResetPasswordModal';

const FONT = 'Poppins, sans-serif';
const PRIMARY = '#6D2323';
const SECONDARY = '#FEF9E1';
const ACCENT = '#C97C5D';
const SUCCESS = '#10B981';
const WARNING = '#F59E0B';
const ERROR = '#EF4444';

export default function NotificationAdmin() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [resetUser, setResetUser] = useState(null);
  const [showResetModal, setShowResetModal] = useState(false);
  const [filter, setFilter] = useState('all'); // all, unread, important
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectionMode, setSelectionMode] = useState(false);

  const broadcastUnreadCount = (list) => {
    const unreadCount = Array.isArray(list) ? list.filter(n => !n.read || n.read === 0).length : 0;
    try {
      window.dispatchEvent(new CustomEvent('notifications:updated', { detail: { count: unreadCount } }));
    } catch (e) {
      console.error('Failed to dispatch notifications update event:', e);
    }
  };

  const setItemsWithBroadcast = (updater) => {
    setItems(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      broadcastUnreadCount(next);
      return next;
    });
  };

  const formatDateTime = (timestamp) => {
    const date = new Date(timestamp);
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    const month = monthNames[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();
    
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes.toString().padStart(2, '0');
    
    return `${month} ${day}, ${year} at ${displayHours}:${displayMinutes} ${ampm}`;
  };

  const getNotificationIcon = (message) => {
    if (!message) return <Info size={20} color={PRIMARY} />;
    
    const msg = message.toLowerCase();
    if (msg.includes('password reset')) return <AlertCircle size={20} color={WARNING} />;
    if (msg.includes('success') || msg.includes('completed')) return <CheckCircle size={20} color={SUCCESS} />;
    if (msg.includes('error') || msg.includes('failed')) return <AlertCircle size={20} color={ERROR} />;
    if (msg.includes('user') || msg.includes('account')) return <User size={20} color={PRIMARY} />;
    
    return <Info size={20} color={PRIMARY} />;
  };

  const getNotificationType = (message) => {
    if (!message) return 'info';
    
    const msg = message.toLowerCase();
    if (msg.includes('password reset')) return 'warning';
    if (msg.includes('success') || msg.includes('completed')) return 'success';
    if (msg.includes('error') || msg.includes('failed')) return 'error';
    if (msg.includes('user') || msg.includes('account')) return 'user';
    
    return 'info';
  };

  const loadNotifications = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/notifications/admin?limit=200');
      if (!res.ok) throw new Error('Failed to load notifications');
      const data = await res.json();
      setItemsWithBroadcast(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationClick = (notification) => {
    if (!notification) return;
    
    // If in selection mode, toggle selection
    if (selectionMode) {
      toggleSelection(notification.id);
      return;
    }
    
    // Set selected notification
    setSelectedNotification(notification);
    setShowModal(true);
    
    // Mark as read if unread - ensure this happens immediately
    if (!notification.read || notification.read === 0) {
      markAsRead(notification.id);
    }
  };

  const toggleSelection = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) 
        ? prev.filter(i => i !== id)
        : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredNotifications.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredNotifications.map(n => n.id));
    }
  };

  const markAsRead = async (notificationId) => {
    if (!notificationId) return;
    const current = items.find(n => n.id === notificationId);
    if (!current || current.read === 1 || current.read === true) return;

    try {
      // Optimistically update UI
      setItemsWithBroadcast(prev =>
        prev.map(n => (n.id === notificationId ? { ...n, read: 1 } : n))
      );

      const res = await fetch(`http://localhost:5000/api/notifications/admin/${notificationId}/read`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!res.ok) {
        throw new Error('Failed to mark notification as read');
      }
    } catch (e) {
      console.error('Failed to mark notification as read:', e);
      // Reload from server to ensure consistency
      loadNotifications();
    }
  };

  const markSelectedAsRead = async () => {
    if (selectedIds.length === 0) return;
    
    try {
      // Optimistically update UI
      setItemsWithBroadcast(prev =>
        prev.map(n => selectedIds.includes(n.id) ? { ...n, read: 1 } : n)
      );

      // Mark each selected notification as read
      const promises = selectedIds.map(id => 
        fetch(`http://localhost:5000/api/notifications/admin/${id}/read`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        })
      );
      
      await Promise.all(promises);
      setSelectedIds([]);
      setSelectionMode(false);
    } catch (e) {
      console.error('Failed to mark selected notifications as read:', e);
      loadNotifications();
    }
  };

  const markSelectedAsUnread = async () => {
    if (selectedIds.length === 0) return;
    
    try {
      // Optimistically update UI
      setItemsWithBroadcast(prev =>
        prev.map(n => selectedIds.includes(n.id) ? { ...n, read: 0 } : n)
      );

      // Mark each selected notification as unread
      const promises = selectedIds.map(id => 
        fetch(`http://localhost:5000/api/notifications/admin/${id}/unread`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        })
      );
      
      await Promise.all(promises);
      setSelectedIds([]);
      setSelectionMode(false);
    } catch (e) {
      console.error('Failed to mark selected notifications as unread:', e);
      loadNotifications();
    }
  };

  const deleteSelected = async () => {
    if (selectedIds.length === 0) return;
    
    try {
      // Optimistically update UI
      setItemsWithBroadcast(prev => prev.filter(n => !selectedIds.includes(n.id)));

      // Delete each selected notification
      const promises = selectedIds.map(id => 
        fetch(`http://localhost:5000/api/notifications/admin/${id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        })
      );
      
      await Promise.all(promises);
      setSelectedIds([]);
      setSelectionMode(false);
    } catch (e) {
      console.error('Failed to delete selected notifications:', e);
      loadNotifications();
    }
  };

  const markAllAsRead = async () => {
    const unreadNotifications = items.filter(n => !n.read || n.read === 0);
    if (unreadNotifications.length === 0) return;
    
    try {
      // Optimistically update UI
      setItemsWithBroadcast(prev =>
        prev.map(n => ({ ...n, read: 1 }))
      );

      // Mark each notification as read
      const promises = unreadNotifications.map(n => 
        fetch(`http://localhost:5000/api/notifications/admin/${n.id}/read`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        })
      );
      
      await Promise.all(promises);
    } catch (e) {
      console.error('Failed to mark all notifications as read:', e);
      // Reload from server to ensure consistency
      loadNotifications();
    }
  };

  const markAllAsUnread = async () => {
    const readNotifications = items.filter(n => n.read === 1 || n.read === true);
    if (readNotifications.length === 0) return;
    
    try {
      // Optimistically update UI
      setItemsWithBroadcast(prev =>
        prev.map(n => ({ ...n, read: 0 }))
      );

      // Mark each notification as unread
      const promises = readNotifications.map(n => 
        fetch(`http://localhost:5000/api/notifications/admin/${n.id}/unread`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        })
      );
      
      await Promise.all(promises);
    } catch (e) {
      console.error('Failed to mark all notifications as unread:', e);
      // Reload from server to ensure consistency
      loadNotifications();
    }
  };

  const closeModal = () => {
    // When closing modal, update selected notification to be marked as read
    if (selectedNotification && (!selectedNotification.read || selectedNotification.read === 0)) {
      markAsRead(selectedNotification.id);
    }
    
    setShowModal(false);
    setSelectedNotification(null);
  };

  const handleResetPassword = async (notification) => {
    if (!notification.user_id) {
      alert('User information not available for this notification.');
      return;
    }

    try {
      // Fetch user details
      const res = await fetch(`http://localhost:5000/api/users/${notification.user_id}`);
      if (!res.ok) throw new Error('Failed to fetch user details');
      const userData = await res.json();
      
      setResetUser(userData);
      setShowResetModal(true);
      closeModal(); // Close notification detail modal
    } catch (e) {
      alert('Failed to load user details: ' + e.message);
    }
  };

  const isPasswordResetNotification = (notification) => {
    return notification.message && notification.message.toLowerCase().includes('password reset requested');
  };

  const filteredNotifications = items.filter(notification => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !notification.read || notification.read === 0;
    if (filter === 'important') {
      const type = getNotificationType(notification.message);
      return type === 'warning' || type === 'error';
    }
    return true;
  });

  useEffect(() => {
    loadNotifications();

    console.log('🔌 Establishing SSE connection for admin notifications');
    const eventSource = new EventSource('http://localhost:5000/api/notifications/admin/stream');
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('📨 Received SSE message:', data.type);
        
        if (data.type === 'new_notification') {
          console.log('➕ Adding new admin notification:', data.data);
          setItemsWithBroadcast(prev => {
            // Check if notification already exists to avoid duplicates
            const exists = prev.some(n => n.id === data.data.id);
            if (exists) {
              console.log('⚠️ Notification already exists, skipping');
              return prev;
            }
            return [data.data, ...prev];
          });
        } else if (data.type === 'notifications_updated') {
          console.log('🔄 Updating all admin notifications');
          setItemsWithBroadcast(Array.isArray(data.data) ? data.data : []);
        } else if (data.type === 'notification_updated') {
          // Update a single notification (e.g., when marked as read/unread)
          console.log('🔄 Updating single notification:', data.data.id);
          setItemsWithBroadcast(prev =>
            prev.map(n => n.id === data.data.id ? { ...data.data, read: data.data.read || 0 } : n)
          );
        } else if (data.type === 'connected') {
          console.log('✅ SSE connected successfully');
          // Reload notifications when connected to ensure we have the latest
          loadNotifications();
        }
      } catch (err) {
        console.error('❌ Error parsing SSE data:', err);
      }
    };

    eventSource.onerror = (err) => {
      console.error('❌ SSE error:', err);
      console.error('SSE readyState:', eventSource.readyState);
      if (eventSource.readyState === EventSource.CLOSED) {
        console.log('🔄 SSE connection closed, will reload notifications');
        setTimeout(() => {
          loadNotifications();
        }, 5000);
      }
    };

    eventSource.onopen = () => {
      console.log('✅ SSE connection opened for admin notifications');
    };

    return () => {
      console.log('🔌 Closing SSE connection');
      eventSource.close();
    };
  }, []);

  const deleteAll = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/notifications/admin/delete-all', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (res.ok) {
        setItemsWithBroadcast([]);
      }
    } catch (e) {
      console.error('Failed to delete all notifications:', e);
    }
  };

  
  if (error) return (
    <div style={{ 
      fontFamily: FONT, 
      padding: 24, 
      color: '#c00',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh'
    }}>
      <AlertCircle size={48} color={ERROR} style={{ marginBottom: '16px' }} />
      <div>Error: {error}</div>
    </div>
  );

  if (loading) return (
    <div style={{ 
      fontFamily: FONT, 
      padding: 24, 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center',
      minHeight: '100vh',
      color: PRIMARY
    }}>
      <div className="loading-spinner" style={{
        width: '40px',
        height: '40px',
        border: `4px solid ${SECONDARY}`,
        borderTop: `4px solid ${PRIMARY}`,
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        marginBottom: '16px'
      }}></div>
      <div>Loading notifications...</div>
    </div>
  );

  return (
    <>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          .notification-card {
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
          }
          
          .notification-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 4px;
            height: 100%;
            background-color: ${PRIMARY};
          }
          
          .notification-card.warning::before {
            background-color: ${WARNING};
          }
          
          .notification-card.success::before {
            background-color: ${SUCCESS};
          }
          
          .notification-card.error::before {
            background-color: ${ERROR};
          }
          
          .notification-card.user::before {
            background-color: ${ACCENT};
          }
          
          .notification-card:hover {
            transform: translateY(-3px);
            box-shadow: 0 8px 16px rgba(109, 35, 35, 0.15);
          }
          
          .notification-card.read {
            opacity: 0.7;
            background: #f9f9f9;
          }
          
          .filter-tab {
            transition: all 0.2s ease;
            position: relative;
          }
          
          .filter-tab.active::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 0;
            width: 100%;
            height: 3px;
            background-color: ${PRIMARY};
          }
        `}
      </style>
      
      <div style={{ 
        fontFamily: FONT, 
        minHeight: '100vh', 
        padding: '0 1rem 1rem 1rem',
        background: 'linear-gradient(to bottom, #fff, #f9f9f9)',
      }}>
        {/* Header */}
        <div style={{ 
          marginBottom: 16,
          background: `linear-gradient(135deg, ${PRIMARY}, ${ACCENT})`,
          padding: '16px 20px',
          borderRadius: '8px',
          color: '#fff',
          boxShadow: '0 2px 8px rgba(109, 35, 35, 0.15)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
            <div>
              <h1 style={{ 
                fontWeight: 700, 
                fontSize: 22,
                margin: '0 0 4px 0',
                fontFamily: FONT,
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <Bell size={22} /> Notifications
              </h1>
              <p style={{ 
                margin: 0,
                fontFamily: FONT,
                opacity: 0.9,
                fontSize: '14px'
              }}>
                {items.filter(n => !n.read || n.read === 0).length} unread, {items.length} total
              </p>
            </div>
          </div>
        </div>

        {/* Filter tabs with action buttons aligned */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
          borderBottom: `1px solid ${SECONDARY}`,
          paddingBottom: '12px',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{
            display: 'flex',
            gap: '24px'
          }}>
            {['all', 'unread', 'important'].map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`filter-tab ${filter === tab ? 'active' : ''}`}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: '10px 0',
                  fontFamily: FONT,
                  fontSize: '15px',
                  fontWeight: filter === tab ? 600 : 400,
                  color: filter === tab ? PRIMARY : '#666',
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                  outline: 'none'
                }}
              >
                {tab === 'all' && `All (${items.length})`}
                {tab === 'unread' && `Unread (${items.filter(n => !n.read || n.read === 0).length})`}
                {tab === 'important' && `Important (${items.filter(n => {
                  const type = getNotificationType(n.message);
                  return type === 'warning' || type === 'error';
                }).length})`}
              </button>
            ))}
          </div>
          
          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {/* Selection Mode Toggle */}
            {items.length > 0 && (
              <button
                onClick={() => {
                  setSelectionMode(!selectionMode);
                  setSelectedIds([]);
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  border: `1px solid ${PRIMARY}`,
                  background: selectionMode ? PRIMARY : '#fff',
                  color: selectionMode ? '#fff' : PRIMARY,
                  fontWeight: 600,
                  fontSize: 13,
                  fontFamily: FONT,
                  borderRadius: 6,
                  padding: '8px 12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                <CheckSquare size={14} /> {selectionMode ? 'Cancel Selection' : 'Select'}
              </button>
            )}

            {/* Selection Actions - only show when in selection mode */}
            {selectionMode && (
              <>
                <button
                  onClick={toggleSelectAll}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    border: `1px solid ${ACCENT}`,
                    background: '#fff',
                    color: ACCENT,
                    fontWeight: 600,
                    fontSize: 13,
                    fontFamily: FONT,
                    borderRadius: 6,
                    padding: '8px 12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = ACCENT;
                    e.target.style.color = '#fff';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = '#fff';
                    e.target.style.color = ACCENT;
                  }}
                >
                  {selectedIds.length === filteredNotifications.length ? (
                    <><CheckSquare size={14} /> Deselect All ({selectedIds.length})</>
                  ) : (
                    <><Square size={14} /> Select All</>
                  )}
                </button>

                {selectedIds.length > 0 && (
                  <>
                    <button
                      onClick={markSelectedAsRead}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        border: `1px solid ${SUCCESS}`,
                        background: '#fff',
                        color: SUCCESS,
                        fontWeight: 600,
                        fontSize: 13,
                        fontFamily: FONT,
                        borderRadius: 6,
                        padding: '8px 12px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.background = SUCCESS;
                        e.target.style.color = '#fff';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.background = '#fff';
                        e.target.style.color = SUCCESS;
                      }}
                    >
                      <Check size={14} /> Mark as Read ({selectedIds.length})
                    </button>

                    <button
                      onClick={markSelectedAsUnread}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        border: `1px solid ${WARNING}`,
                        background: '#fff',
                        color: WARNING,
                        fontWeight: 600,
                        fontSize: 13,
                        fontFamily: FONT,
                        borderRadius: 6,
                        padding: '8px 12px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.background = WARNING;
                        e.target.style.color = '#fff';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.background = '#fff';
                        e.target.style.color = WARNING;
                      }}
                    >
                      <Mail size={14} /> Mark as Unread ({selectedIds.length})
                    </button>

                    <button
                      onClick={deleteSelected}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        border: `1px solid ${ERROR}`,
                        background: '#fff',
                        color: ERROR,
                        fontWeight: 600,
                        fontSize: 13,
                        fontFamily: FONT,
                        borderRadius: 6,
                        padding: '8px 12px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.background = ERROR;
                        e.target.style.color = '#fff';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.background = '#fff';
                        e.target.style.color = ERROR;
                      }}
                    >
                      <Trash2 size={14} /> Delete ({selectedIds.length})
                    </button>
                  </>
                )}
              </>
            )}

            {/* Bulk Actions - only show when NOT in selection mode */}
            {!selectionMode && (
              <>
                {/* Mark All as Read button */}
                {items.filter(n => !n.read || n.read === 0).length > 0 && (
                  <button
                    onClick={markAllAsRead}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      border: `1px solid ${PRIMARY}`,
                      background: '#fff',
                      color: PRIMARY,
                      fontWeight: 600,
                      fontSize: 13,
                      fontFamily: FONT,
                      borderRadius: 6,
                      padding: '8px 12px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = PRIMARY;
                      e.target.style.color = '#fff';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = '#fff';
                      e.target.style.color = PRIMARY;
                    }}
                  >
                    <Check size={14} /> Mark All as Read
                  </button>
                )}
                
                {/* Mark All as Unread button */}
                {items.filter(n => n.read === 1 || n.read === true).length > 0 && (
                  <button
                    onClick={markAllAsUnread}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      border: `1px solid ${PRIMARY}`,
                      background: '#fff',
                      color: PRIMARY,
                      fontWeight: 600,
                      fontSize: 13,
                      fontFamily: FONT,
                      borderRadius: 6,
                      padding: '8px 12px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = PRIMARY;
                      e.target.style.color = '#fff';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = '#fff';
                      e.target.style.color = PRIMARY;
                    }}
                  >
                    <Mail size={14} /> Mark All as Unread
                  </button>
                )}
                
                {/* Delete All button */}
                {items.length > 0 && (
                  <button
                    onClick={deleteAll}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      border: `1px solid ${PRIMARY}`,
                      background: '#fff',
                      color: PRIMARY,
                      fontWeight: 600,
                      fontSize: 13,
                      fontFamily: FONT,
                      borderRadius: 6,
                      padding: '8px 12px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = PRIMARY;
                      e.target.style.color = '#fff';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = '#fff';
                      e.target.style.color = PRIMARY;
                    }}
                  >
                    <Trash2 size={14} /> Delete All
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Notifications Content */}
        <div style={{ 
          maxWidth: '900px',
          margin: '0 auto',
          display: 'flex', 
          flexDirection: 'column', 
          gap: 12 
        }}>
          {filteredNotifications.length === 0 ? (
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center', 
              minHeight: '250px',
              color: '#666',
              fontSize: 15,
              textAlign: 'center',
              background: '#fff',
              borderRadius: '10px',
              padding: '30px 20px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
            }}>
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: SECONDARY,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px'
              }}>
                <Bell size={30} color={PRIMARY} />
              </div>
              <div style={{ fontWeight: 600, marginBottom: '6px', color: PRIMARY, fontSize: 16 }}>
                No notifications yet
              </div>
              <div>
                {filter === 'all' 
                  ? "You're all caught up! No new notifications." 
                  : `No ${filter} notifications at the moment.`}
              </div>
            </div>
          ) : filteredNotifications.map(n => {
            const type = getNotificationType(n.message);
            const isSelected = selectedIds.includes(n.id);
            return (
              <div 
                key={n.id} 
                onClick={() => handleNotificationClick(n)}
                className={`notification-card ${type} ${(n.read === 1 || n.read === true) ? 'read' : ''}`}
                style={{ 
                  background: (n.read === 1 || n.read === true) ? '#f9f9f9' : '#fff', 
                  border: `2px solid ${isSelected ? PRIMARY : (type === 'error' ? ERROR : type === 'warning' ? WARNING : type === 'success' ? SUCCESS : PRIMARY)}20`, 
                  borderRadius: 10,
                  padding: '18px',
                  cursor: 'pointer',
                  width: '100%',
                  maxWidth: '1000px',
                  margin: '0 auto',
                  boxSizing: 'border-box',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '16px',
                  boxShadow: isSelected ? `0 4px 12px ${PRIMARY}40` : '0 2px 8px rgba(0, 0, 0, 0.05)',
                  minHeight: '80px'
                }}
              >
                {/* Selection Checkbox */}
                {selectionMode && (
                  <div 
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSelection(n.id);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '24px',
                      height: '24px',
                      cursor: 'pointer',
                      flexShrink: 0,
                      marginTop: '8px'
                    }}
                  >
                    {isSelected ? (
                      <CheckSquare size={24} color={PRIMARY} />
                    ) : (
                      <Square size={24} color="#999" />
                    )}
                  </div>
                )}

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: type === 'error' ? `${ERROR}20` : type === 'warning' ? `${WARNING}20` : type === 'success' ? `${SUCCESS}20` : `${PRIMARY}20`,
                  flexShrink: 0
                }}>
                  {getNotificationIcon(n.message)}
                </div>
                
                <div style={{ flex: 1 }}>
                  <div style={{ 
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '10px'
                  }}>
                    <div style={{ 
                      fontWeight: 600, 
                      color: PRIMARY, 
                      fontSize: 14,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <Clock size={14} color={PRIMARY} />
                      {formatDateTime(n.timestamp)}
                    </div>
                    {(!n.read || n.read === 0) && (
                      <div style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: PRIMARY
                      }}></div>
                    )}
                  </div>
                  <div style={{ 
                    whiteSpace: 'pre-wrap', 
                    fontSize: 14,
                    lineHeight: 1.6,
                    color: (n.read === 1 || n.read === true) ? '#666' : '#333',
                    paddingBottom: '4px'
                  }}>
                    {n.message}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Enhanced Notification Detail Modal */}
        {showModal && selectedNotification && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            fontFamily: FONT,
            backdropFilter: 'blur(2px)'
          }}>
            <div style={{
              background: '#fff',
              borderRadius: 12,
              padding: 20,
              maxWidth: 500,
              width: '90%',
              maxHeight: '70vh',
              overflow: 'auto',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
              position: 'relative',
              border: `1px solid ${PRIMARY}10`
            }}>
              {/* Modal Header */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 16,
                paddingBottom: 12,
                borderBottom: '1px solid #eee',
                position: 'relative'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: `${PRIMARY}20`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {getNotificationIcon(selectedNotification.message)}
                  </div>
                  <h2 style={{
                    color: PRIMARY,
                    fontWeight: 700,
                    fontSize: 18,
                    margin: 0
                  }}>
                    Notification Details
                  </h2>
                </div>
                <button
                  onClick={closeModal}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 4,
                    borderRadius: 4,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <X size={18} color="#6D2323" />
                </button>
              </div>

              {/* Modal Content */}
              <div style={{ marginBottom: 14 }}>
                <div style={{
                  fontWeight: 600,
                  color: PRIMARY,
                  marginBottom: 6,
                  fontSize: 13,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <Clock size={14} color={PRIMARY} />
                  Date & Time:
                </div>
                <div style={{ 
                  marginBottom: 12,
                  fontSize: 13,
                  padding: '8px 12px',
                  background: '#f9f9f9',
                  borderRadius: '6px'
                }}>
                  {formatDateTime(selectedNotification.timestamp)}
                </div>
              </div>

              <div>
                <div style={{
                  fontWeight: 600,
                  color: PRIMARY,
                  marginBottom: 6,
                  fontSize: 13,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <Info size={14} color={PRIMARY} />
                  Message:
                </div>
                <div style={{
                  background: SECONDARY,
                  border: `1px solid ${PRIMARY}30`,
                  borderRadius: 6,
                  padding: 14,
                  whiteSpace: 'pre-wrap',
                  fontSize: 13,
                  lineHeight: 1.5,
                  marginBottom: isPasswordResetNotification(selectedNotification) ? 12 : 0
                }}>
                  {selectedNotification.message}
                </div>
              </div>

              {/* Reset Password Link for Password Reset Notifications */}
              {isPasswordResetNotification(selectedNotification) && selectedNotification.user_id && (
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #eee' }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleResetPassword(selectedNotification);
                    }}
                    style={{
                      background: PRIMARY,
                      color: '#fff',
                      border: 'none',
                      borderRadius: 6,
                      padding: '10px 16px',
                      fontWeight: 600,
                      fontSize: 13,
                      fontFamily: FONT,
                      cursor: 'pointer',
                      width: '100%',
                      transition: 'background 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                    onMouseEnter={(e) => e.target.style.background = '#5a1a1a'}
                    onMouseLeave={(e) => e.target.style.background = PRIMARY}
                  >
                    <AlertCircle size={14} />
                    Reset Password
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Reset Password Modal */}
        <ResetPasswordModal
          key={resetUser?.id || 'no-user'}
          open={showResetModal}
          onClose={() => {
            setShowResetModal(false);
            setResetUser(null);
          }}
          user={resetUser}
          onReset={() => {
            setShowResetModal(false);
            setResetUser(null);
            loadNotifications();
          }}
        />
      </div>
    </>
  );
}