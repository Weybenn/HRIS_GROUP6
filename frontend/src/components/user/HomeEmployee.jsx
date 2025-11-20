import { useEffect, useState } from 'react';
import RegisterModal from '../modals/RegisterModal';
import UpcomingEventsModal from '../modals/UpcomingEventsModal';
import { Info, Eye, EyeOff, Calendar, Clock, MapPin, User, Users, HeartHandshake, AlarmClock, Bell, FileText, CheckSquare, Settings, ChevronRight, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const FONT = 'Poppins, sans-serif';
const CARD_BG = '#FEF9E1';
const PRIMARY = '#6D2323';
const DARK_RED = '#6D2323';

const formatDate = (dateString) => new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
const formatTime = (timeString) => new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

const sanitizeRichHtml = (html) => {
  if (!html) return '';
  const container = document.createElement('div');
  container.innerHTML = String(html);
  const allowedTags = new Set(['B','STRONG','I','EM','U','P','BR','UL','OL','LI','A','DIV','SPAN']);
  const traverse = (node) => {
    const children = Array.from(node.childNodes);
    for (const child of children) {
      if (child.nodeType === 1) {
        if (!allowedTags.has(child.tagName)) {
          child.replaceWith(...Array.from(child.childNodes));
          continue;
        }
        const isLink = child.tagName === 'A';
        const allowedAttrs = isLink ? ['href','target','rel'] : [];
        for (const attr of Array.from(child.attributes)) {
          if (!allowedAttrs.includes(attr.name.toLowerCase())) {
            child.removeAttribute(attr.name);
          }
        }
        if (isLink) {
          const href = (child.getAttribute('href') || '').trim();
          if (!/^(https?:)?\/\//i.test(href)) {
            child.removeAttribute('href');
          }
          child.setAttribute('target', '_blank');
          child.setAttribute('rel', 'noopener noreferrer');
        }
        traverse(child);
      } else if (child.nodeType === 8) {
        child.remove();
      }
    }
  };
  traverse(container);
  return container.innerHTML;
};

function CalendarCard() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
 
  const daysInMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth() + 1,
    0
  ).getDate();
 
  const firstDayOfMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth(),
    1
  ).getDay();
 
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
 
  const getDaysArray = () => {
    const days = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  };
 
  const isToday = (day) => {
    if (!day) return false;
    return (
      day === currentDate.getDate() &&
      currentMonth.getMonth() === currentDate.getMonth() &&
      currentMonth.getFullYear() === currentDate.getFullYear()
    );
  };
 
  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };
 
  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };
 
  return (
    <div style={{
      background: '#fff',
      borderRadius: 12,
      padding: 16,
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      fontFamily: FONT,
      width: '100%',
      height: '100%',
      border: '2px solid #6d2323',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12
      }}>
        <button 
          onClick={handlePrevMonth} 
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 4,
            borderRadius: 4,
            color: PRIMARY,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(109, 35, 35, 0.1)';
            e.currentTarget.style.transform = 'scale(1.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          <ChevronLeft size={20} />
        </button>
        <h3 style={{
          color: PRIMARY,
          fontSize: 16,
          fontWeight: 700,
          margin: 0
        }}>
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h3>
        <button 
          onClick={handleNextMonth} 
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 4,
            borderRadius: 4,
            color: PRIMARY,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(109, 35, 35, 0.1)';
            e.currentTarget.style.transform = 'scale(1.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          <ChevronRight size={20} />
        </button>
      </div>
     
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: 4,
        marginBottom: 8
      }}>
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
          <div key={index} style={{
            textAlign: 'center',
            fontSize: 12,
            fontWeight: 600,
            color: '#666',
            padding: 4
          }}>
            {day}
          </div>
        ))}
      </div>
     
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: 4,
        flex: 1
      }}>
        {getDaysArray().map((day, index) => (
          <div key={index} style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 6,
            fontSize: 13,
            fontWeight: 500,
            color: isToday(day) ? '#fff' : (day ? '#333' : 'transparent'),
            background: isToday(day) ? PRIMARY : (day ? 'transparent' : 'transparent'),
            cursor: day ? 'pointer' : 'default',
            minHeight: 28,
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            if (day && !isToday(day)) {
              e.currentTarget.style.backgroundColor = 'rgba(109, 35, 35, 0.1)';
            }
          }}
          onMouseLeave={(e) => {
            if (day && !isToday(day)) {
              e.currentTarget.style.backgroundColor = 'transparent';
            }
          }}
          >
            {day}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function HomeEmployee() {
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openRegister, setOpenRegister] = useState(null);
  const [openDetails, setOpenDetails] = useState(null);
  const [employeeProfile, setEmployeeProfile] = useState(null);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [allUpcomingEvents, setAllUpcomingEvents] = useState([]);
  const [showEmployeeId, setShowEmployeeId] = useState(false);
  const [openUpcomingEvents, setOpenUpcomingEvents] = useState(false);
  const [todaysReminders, setTodaysReminders] = useState([]);
  const [evaluationReminders, setEvaluationReminders] = useState([]);
  const [newTrainingBanner, setNewTrainingBanner] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentWorkshopIndex, setCurrentWorkshopIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const navigate = useNavigate();

  const handleEventClick = (event) => {
    const program = programs.find(p => p.id === event.id);
    const detailToShow = program || event;
    setOpenDetails(detailToShow);
    setOpenUpcomingEvents(false);
    setTimeout(() => {
      const element = document.querySelector(`[data-program-id="${detailToShow.id}"]`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  const handleNavigation = (path, fallbackMessage) => {
    try {
      navigate(path);
    } catch (error) {
      console.error('Navigation error:', error);
      alert(fallbackMessage || `The ${path} page is not available. Please contact your administrator.`);
    }
  };

  const handlePrevWorkshop = () => {
    const totalWorkshops = programs.length > 0 ? programs.length : 1;
    setCurrentWorkshopIndex((prevIndex) => (prevIndex - 1 + totalWorkshops) % totalWorkshops);
  };

  const handleNextWorkshop = () => {
    const totalWorkshops = programs.length > 0 ? programs.length : 1;
    setCurrentWorkshopIndex((prevIndex) => (prevIndex + 1) % totalWorkshops);
  };

  const handleSlideClick = (program) => {
    if (program) {
      setOpenDetails(program);
    }
  };

  const user = JSON.parse(localStorage.getItem('user') || 'null');

  // Auto-play carousel
  useEffect(() => {
    if (programs.length <= 1) return;
    
    const interval = setInterval(() => {
      if (!isPaused) {
        handleNextWorkshop();
      }
    }, 5000); // Change slide every 5 seconds

    return () => clearInterval(interval);
  }, [programs.length, isPaused]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
       
        const programsRes = await fetch('http://localhost:5000/api/home/all-training-programs');
        if (!programsRes.ok) throw new Error('Failed to load programs');
        const programsData = await programsRes.json();
        setPrograms(programsData);
       
        if (user?.employee_id) {
          const profileRes = await fetch(`http://localhost:5000/employee-profile/${user.employee_id}`);
          if (profileRes.ok) {
            const profileData = await profileRes.json();
            setEmployeeProfile(profileData);
          }
        }
       
        const eventsRes = await fetch('http://localhost:5000/upcoming-events');
        if (eventsRes.ok) {
          const eventsData = await eventsRes.json();
          setUpcomingEvents(eventsData);
        }
       
        const allEventsRes = await fetch('http://localhost:5000/all-upcoming-events');
        if (allEventsRes.ok) {
          const allEventsData = await allEventsRes.json();
          setAllUpcomingEvents(allEventsData);
        }
       
        if (user?.id) {
          const remindersRes = await fetch(`http://localhost:5000/api/home/todays-reminders/${user.id}`);
          if (remindersRes.ok) {
            const remindersData = await remindersRes.json();
            setTodaysReminders(remindersData);
          }
         
          const evalRes = await fetch(`http://localhost:5000/api/evaluation/completed?user_id=${user.id}`);
          if (evalRes.ok) {
            const evalData = await evalRes.json();
            const unevaluated = (evalData || []).filter(p => p.evaluated === 0);
            setEvaluationReminders(unevaluated);
          }
        }
       
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    load();

    const handleTrainingUpdated = (event) => {
      load();
      if (event?.detail?.type === 'success' && event?.detail?.register_link === 1) {
        setNewTrainingBanner({
          message: 'A new training program is now available!',
          show: true
        });
        setTimeout(() => {
          setNewTrainingBanner(prev => prev ? { ...prev, show: false } : null);
        }, 5000);
      }
    };
   
    const handleRegistrationSuccess = () => {
      if (user?.id) {
        fetch(`http://localhost:5000/api/home/todays-reminders/${user.id}`)
          .then(res => res.ok ? res.json() : [])
          .then(data => setTodaysReminders(data))
          .catch(err => console.error('Error refreshing reminders:', err));
      }
    };
   
    const handleTrainingCompleted = () => {
      if (user?.id) {
        fetch(`http://localhost:5000/api/evaluation/completed?user_id=${user.id}`)
          .then(res => res.ok ? res.json() : [])
          .then(data => {
            const unevaluated = (data || []).filter(p => p.evaluated === 0);
            setEvaluationReminders(unevaluated);
          })
          .catch(err => console.error('Error refreshing evaluation reminders:', err));
      }
    };
   
    window.addEventListener('training:updated', handleTrainingUpdated);
    window.addEventListener('training:registered', handleRegistrationSuccess);
    window.addEventListener('training:completed', handleTrainingCompleted);
   
    const eventSource = new EventSource('http://localhost:5000/stream');
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'new_training' && data.register_link === 1) {
          load();
          setNewTrainingBanner({
            message: 'A new training program is now available!',
            show: true
          });
          setTimeout(() => {
            setNewTrainingBanner(prev => prev ? { ...prev, show: false } : null);
          }, 5000);
        }
      } catch (err) {
        console.error('Error parsing SSE data:', err);
      }
    };
    eventSource.onerror = (err) => {
      console.error('SSE error:', err);
    };
   
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
   
    return () => {
      window.removeEventListener('training:updated', handleTrainingUpdated);
      window.removeEventListener('training:registered', handleRegistrationSuccess);
      window.removeEventListener('training:completed', handleTrainingCompleted);
      eventSource.close();
      clearInterval(timeInterval);
    };
  }, [user?.id]);

  if (loading) return <div style={{ fontFamily: FONT, padding: 24 }}>Loading...</div>;
  if (error) return <div style={{ fontFamily: FONT, padding: 24, color: '#c00' }}>{error}</div>;

  const maskEmployeeId = (employeeId, revealed) => {
    if (revealed) return employeeId;
    if (!employeeId) return '';
    const chars = employeeId.split('');
    return chars
      .map((ch, idx) => {
        if (ch === '-') return ch;
        if (idx === 0 || idx === chars.length - 1) return ch;
        return '*';
      })
      .join('');
  };

  return (
    <div style={{
      fontFamily: FONT,
      minHeight: '100vh',
      padding: 24,
      boxSizing: 'border-box',
    }}>
      {/* Banner Notification */}
      {newTrainingBanner && newTrainingBanner.show && (
        <>
          <style>{`
            @keyframes slideDown {
              from {
                transform: translateY(-100%);
                opacity: 0;
              }
              to {
                transform: translateY(0);
                opacity: 1;
              }
            }
          `}</style>
          <div style={{
            position: 'fixed',
            top: 8,
            left: '50%',
            transform: 'translateX(-50%)',
            width: '90%',
            maxWidth: 900,
            backgroundColor: '#1DA34A',
            color: '#fff',
            padding: '12px 24px',
            borderRadius: 8,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            textAlign: 'center',
            fontWeight: 600,
            fontSize: 14,
            zIndex: 1000,
            pointerEvents: 'none',
            animation: 'slideDown 0.3s ease-out'
          }}>
            <span>{newTrainingBanner.message}</span>
          </div>
        </>
      )}

      {/* Container with Grid Layout */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 24,
        maxWidth: 1400,
        margin: '0 auto'
      }}>
        {/* TOP ROW - User Profile and Time */}
        <div style={{
          display: 'flex',
          gap: 24
        }}>
          {/* User Profile Card - Left */}
          {employeeProfile && (
            <div style={{
              flex: '1',
              background: '#fff',
              borderRadius: 12,
              padding: 20,
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              border: '2px solid #6D2323',
              display: 'flex',
              alignItems: 'center',
              gap: 16
            }}>
              <div style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: '#ddd',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <User size={32} color="#666" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{
                  color: '#6D2323',
                  fontSize: 18,
                  fontWeight: 700,
                  marginBottom: 4
                }}>
                  {employeeProfile.first_name} {employeeProfile.middle_name && employeeProfile.middle_name !== 'NA' ? employeeProfile.middle_name + ' ' : ''}{employeeProfile.last_name}
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}>
                  <span style={{ 
                    color: '#666', 
                    fontSize: 13
                  }}>
                    Employee Number: {maskEmployeeId(employeeProfile.employee_id, showEmployeeId)}
                  </span>
                  <button
                    onClick={() => setShowEmployeeId(!showEmployeeId)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 0,
                      display: 'flex'
                    }}
                  >
                    {showEmployeeId ? <Eye size={14} color="#666" /> : <EyeOff size={14} color="#666" />}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Time Card - Right */}
          <div style={{
            flex: '0 0 auto',
            width: '200px',
            background: '#fff',
            borderRadius: 12,
            border: '2px solid #6d2323',
            padding: 20,
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12
          }}>
            <Clock size={40} color={PRIMARY} />
            <div style={{
              fontSize: 24,
              fontWeight: 700,
              color: PRIMARY,
              textAlign: 'center'
            }}>
              {currentTime.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
              })}
            </div>
          </div>
        </div>

        {/* MIDDLE ROW - Workshop Banner and Calendar */}
        <div style={{
          display: 'flex',
          gap: 24
        }}>
          {/* Workshop Banner - Left (2/3 width) */}
          <div style={{
            flex: '2',
            position: 'relative',
            overflow: 'hidden',
            borderRadius: 12,
            border: '2px solid #6D2323',
            height: 350,
            background: '#fff'
          }}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          >
            <div style={{
              display: 'flex',
              transition: 'transform 0.5s ease-in-out',
              transform: `translateX(-${currentWorkshopIndex * 100}%)`,
              height: '100%'
            }}>
              {programs.length > 0 ? (
                programs.map(p => (
                  <div 
                    key={p.id} 
                    data-program-id={p.id} 
                    style={{
                      minWidth: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      position: 'relative',
                      cursor: 'pointer'
                    }}
                    onClick={() => handleSlideClick(p)}
                  >
                    {p.upload_photo ? (
                      <>
                        <img 
                          src={`http://localhost:5000/uploads/${p.upload_photo}`} 
                          alt={p.program_name || 'Training program'} 
                          style={{ 
                            width: '100%', 
                            height: '100%',
                            objectFit: 'cover',
                            transition: 'transform 0.3s ease'
                          }} 
                        />
                        <div style={{
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          right: 0,
                          background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 50%, transparent 100%)',
                          padding: 20,
                          color: '#fff',
                          transition: 'all 0.3s ease'
                        }}>
                          <div style={{
                            fontSize: 18,
                            fontWeight: 700,
                            marginBottom: 4
                          }}>
                            {p.program_name}
                          </div>
                          <div style={{
                            fontSize: 14,
                            opacity: 0.9
                          }}>
                            {formatDate(p.date)} at {formatTime(p.time)}
                          </div>
                          <div style={{
                            fontSize: 12,
                            opacity: 0.8,
                            marginTop: 4,
                            fontStyle: 'italic'
                          }}>
                            Click to view details
                          </div>
                        </div>
                      </>
                    ) : (
                      <div style={{
                        width: '100%',
                        height: '100%',
                        background: CARD_BG,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexDirection: 'column',
                        padding: 20,
                        textAlign: 'center',
                        transition: 'all 0.3s ease'
                      }}>
                        <span style={{ color: '#999', fontSize: 16, marginBottom: 8 }}>No image available</span>
                        <span style={{ color: '#666', fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{p.program_name}</span>
                        <span style={{ color: '#999', fontSize: 12 }}>{formatDate(p.date)} at {formatTime(p.time)}</span>
                        <span style={{ color: PRIMARY, fontSize: 12, marginTop: 8, fontStyle: 'italic' }}>Click to view details</span>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div style={{
                  minWidth: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  cursor: 'pointer'
                }}
                onClick={() => handleSlideClick(null)}
                >
                  <img
                    src="https://picsum.photos/seed/workshop/800/350"
                    alt="Training program"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                  <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 50%, transparent 100%)',
                    padding: 20,
                    color: '#fff'
                  }}>
                    <div style={{
                      fontSize: 18,
                      fontWeight: 700,
                      marginBottom: 4
                    }}>
                      Training Programs
                    </div>
                    <div style={{
                      fontSize: 14,
                      opacity: 0.9
                    }}>
                      Explore available training opportunities
                    </div>
                    <div style={{
                      fontSize: 12,
                      opacity: 0.8,
                      marginTop: 4,
                      fontStyle: 'italic'
                    }}>
                      Click to view details
                    </div>
                  </div>
                </div>
              )}
            </div>
           
            {/* Carousel Navigation */}
            {programs.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePrevWorkshop();
                  }}
                  style={{
                    position: 'absolute',
                    left: 16,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'rgba(109, 35, 35, 0.8)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '50%',
                    width: 40,
                    height: 40,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    zIndex: 2,
                    transition: 'all 0.3s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(109, 35, 35, 1)';
                    e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(109, 35, 35, 0.8)';
                    e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
                  }}
                >
                  <ChevronLeft size={24} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNextWorkshop();
                  }}
                  style={{
                    position: 'absolute',
                    right: 16,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'rgba(109, 35, 35, 0.8)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '50%',
                    width: 40,
                    height: 40,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    zIndex: 2,
                    transition: 'all 0.3s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(109, 35, 35, 1)';
                    e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(109, 35, 35, 0.8)';
                    e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
                  }}
                >
                  <ChevronRight size={24} />
                </button>
                
                {/* Carousel Indicators */}
                <div style={{
                  position: 'absolute',
                  bottom: 16,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  display: 'flex',
                  gap: 8,
                  zIndex: 2
                }}>
                  {programs.map((_, index) => (
                    <button
                      key={index}
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentWorkshopIndex(index);
                      }}
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        background: index === currentWorkshopIndex ? '#fff' : 'rgba(255,255,255,0.5)',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.2)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Calendar Card - Right (1/3 width) */}
          <div style={{
            flex: '1'
          }}>
            <CalendarCard />
          </div>
        </div>

        {/* BOTTOM ROW - Quick Actions, Reminder, and Upcoming Events */}
        <div style={{
          display: 'flex',
          gap: 24
        }}>
          {/* Quick Actions Card - Left (1/3) */}
          <div style={{
            flex: '1',
            background: '#fff',
            borderRadius: 12,
            border: '2px solid #6d2323',
            padding: 20,
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <h3 style={{
              color: PRIMARY,
              fontSize: 18,
              fontWeight: 700,
              marginBottom: 16,
              marginTop: 0
            }}>
              Quick Actions
            </h3>
           
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gridTemplateRows: 'repeat(2, 1fr)',
              gap: 12,
              flex: 1
            }}>
              <button
                onClick={() => handleNavigation('dashboard_employee/notifications', 'Notifications page is not available yet')}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'transparent',
                  border: '2px solid #6d2323',
                  padding: 16,
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontFamily: FONT,
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(109, 35, 35, 0.1)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <Bell size={24} color={PRIMARY} style={{ marginBottom: 8 }} />
                <span style={{ color: '#333', fontSize: 13, fontWeight: 500 }}>Notifications</span>
              </button>
             
              <button
                onClick={() => handleNavigation('dashboard_employee/training-registration', 'Training Registration page is not available yet')}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'transparent',
                  border: '2px solid #6d2323',
                  padding: 16,
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontFamily: FONT,
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(109, 35, 35, 0.1)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <FileText size={24} color={PRIMARY} style={{ marginBottom: 8 }} />
                <span style={{ color: '#333', fontSize: 13, fontWeight: 500, textAlign: 'center' }}>Training Registration</span>
              </button>
             
              <button
                onClick={() => handleNavigation('dashboard_employee/evaluation', 'Evaluation page is not available yet')}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'transparent',
                  border: '2px solid #6d2323',
                  padding: 16,
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontFamily: FONT,
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(109, 35, 35, 0.1)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <CheckSquare size={24} color={PRIMARY} style={{ marginBottom: 8 }} />
                <span style={{ color: '#333', fontSize: 13, fontWeight: 500 }}>Evaluation</span>
              </button>
             
              <button
                onClick={() => handleNavigation('dashboard_employee/settings', 'Settings page is not available yet')}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'transparent',
                  border: '2px solid #6d2323',
                  padding: 16,
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontFamily: FONT,
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(109, 35, 35, 0.1)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <Settings size={24} color={PRIMARY} style={{ marginBottom: 8 }} />
                <span style={{ color: '#333', fontSize: 13, fontWeight: 500 }}>Settings</span>
              </button>
            </div>
          </div>

          {/* Reminder Card - Center (1/3) */}
          <div style={{
            flex: '1',
            background: CARD_BG,
            borderRadius: 12,
            padding: 20,
            border: `2px solid ${DARK_RED}`,
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            display: 'flex',
            flexDirection: 'column',
            height: '300px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 16
            }}>
              <h3 style={{
                color: DARK_RED,
                fontSize: 18,
                fontWeight: 700,
                margin: 0
              }}>
                Reminder
              </h3>
              <AlarmClock size={20} color={DARK_RED} />
            </div>
           
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              height: 'calc(100% - 40px)',
              overflowY: 'auto',
              paddingRight: '5px'
            }}>
              {(todaysReminders && todaysReminders.length > 0) || (evaluationReminders && evaluationReminders.length > 0) ? (
                <>
                  {todaysReminders.map((reminder) => (
                    <div
                      key={reminder.id}
                      style={{
                        background: '#fff',
                        border: `2px solid ${DARK_RED}`,
                        borderRadius: 8,
                        padding: 12,
                        transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateX(4px)';
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateX(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <div style={{
                        color: DARK_RED,
                        fontSize: 14,
                        fontWeight: 600,
                        marginBottom: 4
                      }}>
                        {reminder.program_name}
                      </div>
                      <div style={{ color: '#666', fontSize: 13 }}>
                        {new Date(reminder.date).toDateString() === new Date().toDateString()
                          ? `Today at ${formatTime(reminder.time)}`
                          : formatDate(reminder.date) + ' at ' + formatTime(reminder.time)}
                      </div>
                    </div>
                  ))}
                 
                  {evaluationReminders.map((reminder) => (
                    <div
                      key={reminder.registration_id}
                      style={{
                        background: '#fff',
                        border: `2px solid #ffc107`,
                        borderRadius: 8,
                        padding: 12,
                        transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateX(4px)';
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateX(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <div style={{
                        color: '#856404',
                        fontSize: 14,
                        fontWeight: 600,
                        marginBottom: 4
                      }}>
                        {reminder.program_name}
                      </div>
                      <div style={{ color: '#856404', fontSize: 13 }}>
                        Please complete the evaluation form
                      </div>
                    </div>
                  ))}
                </>
              ) : (
                <div style={{
                  color: '#666',
                  fontSize: 14,
                  textAlign: 'center',
                  padding: 24
                }}>
                  No reminders at this time
                </div>
              )}
            </div>
          </div>

          {/* Upcoming Events Card - Right (1/3) */}
          <div style={{
            flex: '1',
            background: CARD_BG,
            borderRadius: 12,
            padding: 20,
            border: `2px solid ${DARK_RED}`,
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            display: 'flex',
            flexDirection: 'column',
            height: '300px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 16
            }}>
              <h3 style={{
                color: DARK_RED,
                fontSize: 18,
                fontWeight: 700,
                margin: 0
              }}>
                Upcoming Events
              </h3>
              <button
                onClick={() => setOpenUpcomingEvents(true)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(109, 35, 35, 0.1)';
                  e.currentTarget.style.transform = 'scale(1.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                <Calendar size={20} color={DARK_RED} />
              </button>
            </div>
           
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              height: 'calc(100% - 40px)',
              overflowY: 'auto',
              paddingRight: '5px'
            }}>
              {upcomingEvents && upcomingEvents.length > 0 ? (
                upcomingEvents.slice(0, 3).map((event) => (
                  <button
                    key={event.id}
                    onClick={() => handleEventClick(event)}
                    style={{
                      background: '#fff',
                      border: `2px solid ${DARK_RED}`,
                      borderRadius: 8,
                      padding: 12,
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      fontFamily: FONT
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#f8f9fa';
                      e.currentTarget.style.transform = 'translateX(4px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#fff';
                      e.currentTarget.style.transform = 'translateX(0)';
                    }}
                  >
                    <div style={{
                      color: DARK_RED,
                      fontSize: 14,
                      fontWeight: 600,
                      marginBottom: 4
                    }}>
                      {event.program_name}
                    </div>
                    <div style={{
                      color: '#666',
                      fontSize: 13
                    }}>
                      {formatDate(event.date)} at {formatTime(event.time)}
                    </div>
                  </button>
                ))
              ) : (
                <div style={{
                  color: '#666',
                  fontSize: 14,
                  textAlign: 'center',
                  padding: 24
                }}>
                  No upcoming events
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Register Modal */}
      <RegisterModal
        open={!!openRegister}
        onClose={() => setOpenRegister(null)}
        defaultEmail={user?.email}
        userId={user?.id}
        trainingId={openRegister?.id}
        onSuccess={() => {
          window.dispatchEvent(new CustomEvent('training:registered'));
        }}
      />

      {/* Details Modal */}
      {openDetails && (
        <div style={{ 
          position: 'fixed', 
          inset: 0, 
          background: 'rgba(0,0,0,0.5)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          zIndex: 1000 
        }}>
          <div style={{ 
            background: '#fff', 
            borderRadius: 12, 
            padding: 24, 
            width: 720, 
            maxWidth: '90vw', 
            maxHeight: '80vh', 
            overflowY: 'auto', 
            boxShadow: '0 10px 30px rgba(0,0,0,0.3)', 
            position: 'relative' 
          }}>
            <button 
              onClick={() => setOpenDetails(null)} 
              style={{ 
                position: 'absolute', 
                top: 16, 
                right: 16, 
                background: 'none', 
                border: 'none', 
                cursor: 'pointer', 
                color: PRIMARY,
                fontSize: 24,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                width: 32,
                height: 32,
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(109, 35, 35, 0.1)';
                e.currentTarget.style.transform = 'rotate(90deg)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.transform = 'rotate(0deg)';
              }}
            >
              ✕
            </button>
            <div style={{ color: PRIMARY, fontWeight: 700, fontSize: 24, marginBottom: 16 }}>
              {openDetails.program_name}
            </div>
            {openDetails.upload_photo && (
              <div style={{ marginBottom: 16 }}>
                <img 
                  src={`http://localhost:5000/uploads/${openDetails.upload_photo}`} 
                  alt="program" 
                  style={{ 
                    width: '100%', 
                    borderRadius: 8, 
                    border: '1px solid #eee', 
                    objectFit: 'cover' 
                  }} 
                />
              </div>
            )}
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: 12, 
              marginBottom: 16, 
              fontSize: 14, 
              color: '#333' 
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Calendar size={16} color={PRIMARY} />
                <div>{formatDate(openDetails.date)}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Clock size={16} color={PRIMARY} />
                <div>{formatTime(openDetails.time)}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <MapPin size={16} color={PRIMARY} />
                <div>{openDetails.venue || '—'}</div>
              </div>
              {openDetails.department && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <HeartHandshake size={16} color={PRIMARY} />
                  <div>{openDetails.department}</div>
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <User size={16} color={PRIMARY} />
                <div>{openDetails.instructor || '—'}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Users size={16} color={PRIMARY} />
                <div>{openDetails.max_participants || '—'} max participants</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Info size={16} color={PRIMARY} />
                <div>{openDetails.mode}</div>
              </div>
            </div>
            {openDetails.description && (
              <>
                <style>{`
                  .rich-content ul { list-style: disc; padding-left: 1.25rem; margin: 0.5rem 0; }
                  .rich-content ol { list-style: decimal; padding-left: 1.25rem; margin: 0.5rem 0; }
                  .rich-content li { margin: 0.25rem 0; }
                  .rich-content a { color: #1d4ed8; text-decoration: underline; }
                  .rich-content p { margin: 0.5rem 0; }
                `}</style>
                <div
                  className="rich-content"
                  style={{ 
                    background: '#f8f9fa', 
                    border: '1px solid #eee', 
                    borderRadius: 8, 
                    padding: 16 
                  }}
                  dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(openDetails.description) }}
                />
              </>
            )}
          </div>
        </div>
      )}

      {/* Upcoming Events Modal */}
      <UpcomingEventsModal
        open={openUpcomingEvents}
        onClose={() => setOpenUpcomingEvents(false)}
        events={allUpcomingEvents}
        onEventClick={handleEventClick}
      />
    </div>
  );
}