import React from 'react';
import { Home, Bell, ChartLine, Briefcase, Settings, LogOut, PieChart, Award, Lock, Unlock } from 'lucide-react'; // Added Lock and Unlock icons
import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

const menuItems = [
  { label: 'Home', icon: <Home size={28} />, path: '/dashboard_admin', type: 'menu' },
  { label: 'Notifications', icon: <Bell size={28} />, path: '/dashboard_admin/notifications', type: 'menu' },
  { label: 'Training Programs', icon: <PieChart size={28} />, path: '/dashboard_admin/training-programs', type: 'menu' },
  { label: 'Data', icon: <ChartLine size={28} />, path: '/dashboard_admin/data', type: 'menu' },
  { label: 'Certification', icon: <Award size={28} />, path: '/dashboard_admin/certificates', type: 'menu' },
  { label: 'Job Offerings', icon: <Briefcase size={28} />, path: '/dashboard_admin/job-categories', type: 'menu' },
  { label: 'Settings', icon: <Settings size={28} />, path: '/dashboard_admin/settings', type: 'menu' },
  { label: 'Log out', icon: <LogOut size={28} />, path: '/login', type: 'menu' },
];

const SIDEBAR_BG = '#A31D1D';
const HIGHLIGHT_BG = '#FFFFFF';
const FONT = 'Poppins, sans-serif';

export default function SidebarAdmin({ expanded, setExpanded, headerHeight = 70, manualExpand, setManualExpand, style, isModalOpen }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [notificationCount, setNotificationCount] = useState(0);

  const loadNotificationCount = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/notifications/admin?limit=200');
      if (res.ok) {
        const data = await res.json();
        const unreadCount = Array.isArray(data) ? data.filter(n => !n.read).length : 0;
        setNotificationCount(unreadCount);
      }
    } catch (err) {
      console.error('Failed to load notification count:', err);
    }
  };

  useEffect(() => {
    loadNotificationCount();

    // Listen for notification updates from the NotificationAdmin component
    const handleNotificationUpdate = (event) => {
      setNotificationCount(event.detail.count);
    };

    window.addEventListener('notifications:updated', handleNotificationUpdate);

    const eventSource = new EventSource('http://localhost:5000/api/notifications/admin/stream');
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'new_notification') {
          // Increment count for new notifications
          setNotificationCount(prev => prev + 1);
        } else if (data.type === 'notifications_updated') {
          // Update count with unread notifications from server
          const unreadCount = data.data.filter(n => !n.read).length;
          setNotificationCount(unreadCount);
        }
      } catch (err) {
        console.error('Error parsing SSE data:', err);
      }
    };

    eventSource.onerror = (err) => {
      console.error('SSE error:', err);
    };

    return () => {
      eventSource.close();
      window.removeEventListener('notifications:updated', handleNotificationUpdate);
    };
  }, []);

  const handleMouseEnter = () => {
    if (!manualExpand && !isModalOpen) setExpanded(true);
  };
  const handleMouseLeave = () => {
    if (!manualExpand && !isModalOpen) setExpanded(false);
  };

  const handleNav = (path, type) => {
    if (path === '/login') {
      handleLogout();
      return;
    }
    navigate(path);
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login", { replace: true });
  };

  // New handler for toggling lock
  const handleToggleLock = () => {
    const newLockState = !manualExpand;
    setManualExpand(newLockState);
    if (newLockState) {
      setExpanded(true); // Ensure sidebar is open when locked
    }
  };

  return (
    <div
      style={{
        width: expanded ? 250 : 80,
        background: SIDEBAR_BG,
        minHeight: `calc(100vh - ${headerHeight}px)`,
        transition: 'width 0.2s',
        boxShadow: '2px 0 8px #0001',
        display: 'flex',
        flexDirection: 'column',
        alignItems: expanded ? 'flex-start' : 'center',
        paddingTop: 24,
        fontFamily: FONT,
        marginTop: 0,
        ...style,
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Header Section */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: expanded ? 'flex-start' : 'center',
          width: expanded ? 250 : 56,
          height: 70,
          marginBottom: 20,
          padding: expanded ? '0 16px' : 0,
          borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            backgroundColor: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: expanded ? 12 : 0,
          }}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill={SIDEBAR_BG}
          >
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
          </svg>
        </div>
        {expanded && (
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <span style={{ color: '#FFFFFF', fontSize: 15, fontWeight: 'bold' }}>
              EARIST HR
            </span>
            <span style={{ color: '#FFFFFF', fontSize: 13 }}>
              Admin Panel
            </span>
          </div>
        )}
        {/* Lock/Unlock Icon - only visible when expanded */}
        {expanded && (
          <div
            onClick={handleToggleLock}
            style={{
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            {React.cloneElement(
              manualExpand ? <Lock size={20} /> : <Unlock size={20} />,
              { color: '#FFFFFF', strokeWidth: 2 }
            )}
          </div>
        )}
      </div>
      
      {/* Menu Items */}
      {menuItems.map((item, idx) => {
        const isActive = location.pathname === item.path || (item.label === 'Home' && location.pathname === '/dashboard_admin');
        let borderRadius = expanded ? '0 28px 28px 0' : '50%';
        const isNotification = item.label === 'Notifications';
        
        return (
          <div
            key={item.label}
            onClick={() => handleNav(item.path, item.type)}
            style={{
              display: 'grid',
              gridTemplateColumns: expanded ? '28px auto' : '28px',
              alignItems: 'center',
              width: expanded ? 230 : 56,
              height: 56,
              margin: '2px 0',
              background: isActive ? HIGHLIGHT_BG : 'none',
              borderRadius,
              cursor: 'pointer',
              padding: expanded ? '0 16px 0 18px' : 0,
              color: isActive ? '#A31D1D' : '#FFFFFF',
              fontWeight: 500,
              fontSize: 15,
              fontFamily: FONT,
              transition: 'background 0.2s, width 0.2s, grid-template-columns 0.2s, color 0.2s',
              columnGap: expanded ? 12 : 0,
              justifyContent: expanded ? 'initial' : 'center',
              marginLeft: 0,
              position: 'relative'
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                e.currentTarget.style.background = '#FFFFFF';
                e.currentTarget.style.color = '#A31D1D';
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                e.currentTarget.style.background = 'none';
                e.currentTarget.style.color = '#FFFFFF';
              }
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, position: 'relative' }}>
              {/* Clone the icon and ensure it has the right color */}
              {React.cloneElement(item.icon, {
                style: { transition: 'color 0.2s' }
              })}
              {isNotification && notificationCount > 0 && (
                <div style={{
                  position: 'absolute',
                  top: -6,
                  right: -6,
                  backgroundColor: '#FFFFFF',
                  color: '#A31D1D',
                  borderRadius: '50%',
                  width: 20,
                  height: 20,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 12,
                  fontWeight: 'bold',
                  fontFamily: FONT
                }}>
                  {notificationCount > 99 ? '99+' : notificationCount}
                </div>
              )}
            </div>
            {expanded && (
              <span style={{ whiteSpace: 'nowrap', position: 'relative' }}>
                {item.label}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}