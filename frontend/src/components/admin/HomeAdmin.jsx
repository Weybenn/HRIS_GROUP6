import { useEffect, useState, useRef } from 'react';
import RegisterModal from '../modals/RegisterModal';
import UpcomingEventsModal from '../modals/UpcomingEventsModal'; // keep import if still used elsewhere; can remove if unused
import {
Info,
Calendar,
PieChart,
Briefcase,
IdCard,
Eye,
EyeOff,
Clock,
MapPin,
User,
Users,
HeartHandshake,
ChartLine,
PlusCircle,
FileCheck,
Database,
UserPlus,
ChevronLeft,
ChevronRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const FONT = 'Poppins, sans-serif';
const CARD_BG = '#FEF9E1';
const PRIMARY = '#6D2323';
const SIDEBAR_CARD_HEIGHT = 140;

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

export default function HomeAdmin() {
const [programs, setPrograms] = useState([]);
const [jobCount, setJobCount] = useState(0);
const [applicantCount, setApplicantCount] = useState(0);
const [loading, setLoading] = useState(true);
const [error, setError] = useState('');
const [openRegister, setOpenRegister] = useState(null);
const [openDetails, setOpenDetails] = useState(null);
const [employeeProfile, setEmployeeProfile] = useState(null);
const [summary, setSummary] = useState(null);
const [showEmployeeId, setShowEmployeeId] = useState(false);
const [clockTime, setClockTime] = useState(new Date());
const navigate = useNavigate();
const quickActionsRef = useRef(null);
const scrollbarTrackRef = useRef(null);
const [quickActionsScroll, setQuickActionsScroll] = useState({
thumbWidth: 100,
thumbOffset: 0,
canScrollLeft: false,
canScrollRight: false
});
const [isDraggingThumb, setIsDraggingThumb] = useState(false);

useEffect(() => {
const load = async () => {
try {
setLoading(true);
const res = await fetch('http://localhost:5000/api/home/training-programs');
if (!res.ok) throw new Error('Failed to load');
const data = await res.json();
setPrograms(data);

try {
const sRes = await fetch('http://localhost:5000/api/home/summary');
if (sRes.ok) {
const sData = await sRes.json();
setSummary(sData);
}
} catch (e) {}

const user = JSON.parse(localStorage.getItem('user') || 'null');
if (user?.employee_id) {
try {
const profileRes = await fetch(`http://localhost:5000/employee-profile/${user.employee_id}`);
if (profileRes.ok) {
const profileData = await profileRes.json();
setEmployeeProfile(profileData);
}
} catch (e) {}
}
} catch (e) {
setError(e.message);
} finally {
setLoading(false);
}
};
load();

const loadJobCount = async () => {
try {
const r = await fetch('http://localhost:5000/job-postings');
if (!r.ok) return;
const d = await r.json();
if (Array.isArray(d)) setJobCount(d.length);
} catch (e) {}
};
loadJobCount();

const loadApplicantCount = async () => {
try {
const r = await fetch('http://localhost:5000/applicants');
if (!r.ok) return;
const d = await r.json();
if (Array.isArray(d)) setApplicantCount(d.length);
} catch (e) {}
};
loadApplicantCount();

const handleTrainingUpdated = () => {
load();
};
window.addEventListener('training:updated', handleTrainingUpdated);
return () => window.removeEventListener('training:updated', handleTrainingUpdated);
}, []);

// live clock
useEffect(() => {
const t = setInterval(() => setClockTime(new Date()), 1000);
return () => clearInterval(t);
}, []);

useEffect(() => {
const handleScrollState = () => {
const target = quickActionsRef.current;
if (!target) return;
const { scrollLeft, scrollWidth, clientWidth } = target;
const maxScroll = Math.max(scrollWidth - clientWidth, 0);
const canScrollLeft = scrollLeft > 2;
const canScrollRight = scrollLeft < maxScroll - 2;
const baseWidth = scrollWidth > 0 ? (clientWidth / scrollWidth) * 100 : 100;
const thumbWidth = Math.min(Math.max(baseWidth, maxScroll > 0 ? 18 : 100), 100);
const thumbOffset = maxScroll > 0 ? (scrollLeft / maxScroll) * (100 - thumbWidth) : 0;
setQuickActionsScroll({
thumbWidth,
thumbOffset,
canScrollLeft,
canScrollRight
});
};

handleScrollState();
const container = quickActionsRef.current;
container?.addEventListener('scroll', handleScrollState);
window.addEventListener('resize', handleScrollState);
return () => {
container?.removeEventListener('scroll', handleScrollState);
window.removeEventListener('resize', handleScrollState);
};
}, []);

// Handle thumb dragging
useEffect(() => {
const handleMouseMove = (e) => {
if (!isDraggingThumb || !scrollbarTrackRef.current || !quickActionsRef.current) return;

const track = scrollbarTrackRef.current;
const trackRect = track.getBoundingClientRect();
const trackWidth = trackRect.width;
const thumbWidth = (quickActionsScroll.thumbWidth / 100) * trackWidth;
const maxThumbOffset = trackWidth - thumbWidth;

const offsetX = e.clientX - trackRect.left;
const newThumbOffset = Math.max(0, Math.min(offsetX - thumbWidth / 2, maxThumbOffset));
const thumbOffsetPercent = (newThumbOffset / maxThumbOffset) * (100 - quickActionsScroll.thumbWidth);

const container = quickActionsRef.current;
const maxScroll = container.scrollWidth - container.clientWidth;
const newScrollLeft = (thumbOffsetPercent / 100) * maxScroll / ((100 - quickActionsScroll.thumbWidth) / 100);

container.scrollLeft = newScrollLeft;
};

const handleMouseUp = () => {
setIsDraggingThumb(false);
};

const handleTouchMove = (e) => {
if (!isDraggingThumb || !scrollbarTrackRef.current || !quickActionsRef.current) return;

const touch = e.touches[0];
const track = scrollbarTrackRef.current;
const trackRect = track.getBoundingClientRect();
const trackWidth = trackRect.width;
const thumbWidth = (quickActionsScroll.thumbWidth / 100) * trackWidth;
const maxThumbOffset = trackWidth - thumbWidth;

const offsetX = touch.clientX - trackRect.left;
const newThumbOffset = Math.max(0, Math.min(offsetX - thumbWidth / 2, maxThumbOffset));
const thumbOffsetPercent = (newThumbOffset / maxThumbOffset) * (100 - quickActionsScroll.thumbWidth);

const container = quickActionsRef.current;
const maxScroll = container.scrollWidth - container.clientWidth;
const newScrollLeft = (thumbOffsetPercent / 100) * maxScroll / ((100 - quickActionsScroll.thumbWidth) / 100);

container.scrollLeft = newScrollLeft;
};

const handleTouchEnd = () => {
setIsDraggingThumb(false);
};

if (isDraggingThumb) {
document.addEventListener('mousemove', handleMouseMove);
document.addEventListener('mouseup', handleMouseUp);
document.addEventListener('touchmove', handleTouchMove);
document.addEventListener('touchend', handleTouchEnd);
return () => {
document.removeEventListener('mousemove', handleMouseMove);
document.removeEventListener('mouseup', handleMouseUp);
document.removeEventListener('touchmove', handleTouchMove);
document.removeEventListener('touchend', handleTouchEnd);
};
}
}, [isDraggingThumb, quickActionsScroll.thumbWidth]);

const user = JSON.parse(localStorage.getItem('user') || 'null');

if (loading) return <div style={{ fontFamily: FONT, padding: 24 }}>Loading...</div>;
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

const scrollQuickActions = (direction) => {
const container = quickActionsRef.current;
if (!container) return;
const offset = (container.clientWidth || 120) * 0.85;
container.scrollBy({ left: offset * direction, behavior: 'smooth' });
};

const handleThumbMouseDown = (e) => {
e.preventDefault();
setIsDraggingThumb(true);
};

const handleThumbTouchStart = (e) => {
e.preventDefault();
setIsDraggingThumb(true);
};

const quickActionItems = [
{
key: 'add-training',
icon: <Clock size={18} />,
label: 'Add Training',
onClick: () => navigate('/dashboard_admin/training-programs', { state: { openAddTraining: true } })
},
{
key: 'post-job',
icon: <Briefcase size={18} />,
label: 'Post a job',
onClick: () => navigate('/dashboard_admin/job-categories', { state: { openPostJob: true } })
},
{
key: 'create-cert',
icon: <FileCheck size={18} />,
label: 'create cert.',
onClick: () => navigate('/dashboard_admin/certificates')
},
{
key: 'manage-data',
icon: <ChartLine size={18} />,
label: 'Manage Data',
onClick: () => navigate('/dashboard_admin/data')
},
{
key: 'create-account',
icon: <UserPlus size={18} />,
label: 'Create Account',
onClick: () => navigate('/dashboard_admin/settings', { state: { openCreateAccount: true } })
}
];

  return (
    <div style={{ fontFamily: FONT, padding: '0 5px 5px', width: '100%' ,}}>
<div style={{ width: '100%', maxWidth: '100%', margin: 0 }}>
{/* Main Grid Layout - 4 columns to ensure alignment */}
<div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 2, }}>
{/* Training Programs Card */}
<div
onClick={() => navigate('/dashboard_admin/training-programs')}
role="button" tabIndex={0}
style={{
background: '#fff', borderRadius: 10, padding: 10, boxShadow: '0 1px 4px #0001',
fontFamily: FONT, border: `2px solid ${PRIMARY}`, display: 'flex', flexDirection: 'column', justifyContent: 'center',
minHeight: 82, boxSizing: 'border-box', cursor: 'pointer', position: 'relative'
}}
>
<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: 24, marginBottom: 8 }}>
<div style={{ fontWeight: 700, color: PRIMARY, fontSize: 13 }}>Training Programs</div>
</div>
<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, position: 'relative' }}>
<div style={{ fontSize: 22, fontWeight: 800, color: PRIMARY }}>{summary ? summary.total_training_programs : '—'}</div>
<Clock size={18} color={PRIMARY} />
</div>
<div style={{ marginTop: 1, color: '#000000', fontSize: 10, textAlign: 'center' }}>Total programs posted</div>
</div>

{/* Job Offerings Card */}
<div
onClick={() => navigate('/dashboard_admin/job-categories')}
role="button" tabIndex={0}
style={{
background: '#fff', borderRadius: 10, padding: 10, boxShadow: '0 1px 4px #0001',
fontFamily: FONT, border: `2px solid ${PRIMARY}`, display: 'flex', flexDirection: 'column', justifyContent: 'center',
minHeight: 82, boxSizing: 'border-box', cursor: 'pointer', position: 'relative'
}}
>
<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: 24, marginBottom: 8 }}>
<div style={{ fontWeight: 700, color: PRIMARY, fontSize: 13 }}>Job Offerings</div>
</div>
<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, position: 'relative' }}>
<div style={{ fontSize: 22, fontWeight: 800, color: PRIMARY }}>{jobCount}</div>
<Briefcase size={18} color={PRIMARY} />
</div>
<div style={{ marginTop: 2, color: '#000000', fontSize: 10, textAlign: 'center' }}>Total job offering posted</div>
</div>

{/* Applicants Card */}
<div
onClick={() => navigate('/dashboard_admin/applicants-management')}
role="button" tabIndex={0}
style={{
background: '#fff', borderRadius: 10, padding: 10, boxShadow: '0 1px 4px #0001',
fontFamily: FONT, border: `2px solid ${PRIMARY}`, display: 'flex', flexDirection: 'column', justifyContent: 'center',
minHeight: 82, boxSizing: 'border-box', cursor: 'pointer', position: 'relative'
}}
>
<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: 24, marginBottom: 8 }}>
<div style={{ fontWeight: 700, color: PRIMARY, fontSize: 13 }}>Applicants</div>
</div>
<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, position: 'relative' }}>
<div style={{ fontSize: 22, fontWeight: 800, color: PRIMARY }}>{applicantCount}</div>
<IdCard size={18} color={PRIMARY} />
</div>
<div style={{ marginTop: 2, color: '#000000', fontSize: 10, textAlign: 'center' }}>Total applicants</div>
</div>

{/* User Profile and Time Card (stacked) */}
<div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
<div style={{
background: PRIMARY, borderRadius: 12, padding: 10, boxShadow: '0 1px 6px #0001',
fontFamily: FONT, minHeight: 80, boxSizing: 'border-box', color: '#FEF9E1', border: '2px solid #fff'
}}>
{employeeProfile && (
<>
<div style={{ marginBottom: 6 }}>
<div style={{ fontSize: 14, fontWeight: 700, color: '#FEF9E1', marginBottom: 6 }}>
{employeeProfile.first_name} {employeeProfile.middle_name && employeeProfile.middle_name !== 'NA' ? employeeProfile.middle_name + ' ' : ''}{employeeProfile.last_name}
</div>
<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
<span style={{ fontSize: 13, color: '#FEF9E1' }}>Employee Number: {maskEmployeeId(employeeProfile.employee_id, showEmployeeId)}</span>
<button onClick={() => setShowEmployeeId(!showEmployeeId)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginLeft: 8 }}>
{showEmployeeId ? <Eye size={15} color={'#FEF9E1'} /> : <EyeOff size={15} color={'#FEF9E1'} />}
</button>
</div>
</div>
</>
)}
</div>
<div style={{
background: '#fff', borderRadius: 12, padding: 10, border: `2px solid ${PRIMARY}`,
boxShadow: '0 1px 4px rgba(0,0,0,0.08)', fontFamily: FONT, display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center'
}}>
<Clock size={16} color={PRIMARY} />
<div style={{ fontSize: 16, fontWeight: 700, color: PRIMARY, }}>
{clockTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
</div>
</div>
</div>
</div>

{/* Second Row - Workshop Section spanning 3 columns, Calendar and Quick Actions in the 4th column */}
<div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 5, alignItems: 'stretch', minWidth: 0, width: '100%' }}>
{/* Workshop Section - spans first 3 columns */}
<div style={{ gridColumn: 'span 3', display: 'flex', flexDirection: 'column', minWidth: 0, width: '100%' }}>
{programs && programs.length > 0 ? (
<TrainingDetailsCard programs={programs} />
) : (
<div style={{
background: CARD_BG, border: `2px solid ${PRIMARY}`, borderRadius: 12, padding: 2, textAlign: 'center',
fontFamily: FONT, color: PRIMARY, fontWeight: 600, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center'
}}>
No upcoming training programs available.
</div>
)}
</div>

{/* Right: Calendar and Quick Actions stacked - in the 4th column */}
<div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
{/* Calendar */}
<div style={{
background: CARD_BG, borderRadius: 12, padding: 8, border: `2px solid ${PRIMARY}`,
          boxShadow: '0 1px 6px rgba(0,0,0,0.06)', fontFamily: FONT,
          height: 200, maxHeight: 200, overflow: 'hidden', boxSizing: 'border-box'
}}>
<SmallCalendar />
</div>

{/* Quick Actions - now flexes to fill remaining space */}
<div style={{
background: '#fff', borderRadius: 12, padding: 12, border: `2px solid ${PRIMARY}`,
          boxShadow: '0 1px 6px rgba(0,0,0,0.06)', fontFamily: FONT,
          flex: 1, minHeight: 190, boxSizing: 'border-box', display: 'flex', flexDirection: 'column', 
}}>
<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
<h3 style={{ color: PRIMARY, fontSize: 16, fontWeight: 700, margin: 0 }}>Quick Actions</h3>
</div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
          <div
            ref={quickActionsRef}
            className="quick-actions-scroll"
            style={{
              display: 'flex',
              gap: 8,
              overflowX: 'auto',
              paddingBottom: 4,
              scrollSnapType: 'x mandatory',
              scrollBehavior: 'smooth',
              scrollbarWidth: 'none', /* Firefox */
              msOverflowStyle: 'none', /* IE and Edge */
            }}
            onScroll={(e) => {
              const target = e.target;
              const { scrollLeft, scrollWidth, clientWidth } = target;
              const maxScroll = Math.max(scrollWidth - clientWidth, 0);
              const canScrollLeft = scrollLeft > 2;
              const canScrollRight = scrollLeft < maxScroll - 2;
              const baseWidth = scrollWidth > 0 ? (clientWidth / scrollWidth) * 100 : 100;
              const thumbWidth = Math.min(Math.max(baseWidth, maxScroll > 0 ? 18 : 100), 100);
              const thumbOffset = maxScroll > 0 ? (scrollLeft / maxScroll) * (100 - thumbWidth) : 0;
              setQuickActionsScroll({
                thumbWidth,
                thumbOffset,
                canScrollLeft,
                canScrollRight
              });
            }}
          >
            {quickActionItems.map((action) => (
              <QuickActionButton
                key={action.key}
                icon={action.icon}
                label={action.label}
                onClick={action.onClick}
              />
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 'auto' }}>
            <button
              onClick={() => scrollQuickActions(-1)}
              disabled={!quickActionsScroll.canScrollLeft}
              style={{
                width: 32,
                height: 32,
                borderRadius: 999,
                border: `1px solid ${PRIMARY}`,
                background: quickActionsScroll.canScrollLeft ? '#fff' : '#f8dede',
                color: PRIMARY,
                cursor: quickActionsScroll.canScrollLeft ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
                opacity: quickActionsScroll.canScrollLeft ? 1 : 0.5
              }}
            >
              <ChevronLeft size={16} strokeWidth={2.5} />
            </button>

            <div 
              ref={scrollbarTrackRef}
              style={{
                flex: 1,
                height: 14,
                borderRadius: 999,
                border: `1px solid ${PRIMARY}`,
                background: '#fff',
                position: 'relative',
                overflow: 'hidden',
                cursor: 'pointer'
              }}
              onClick={(e) => {
                const track = scrollbarTrackRef.current;
                const container = quickActionsRef.current;
                if (!track || !container) return;
                
                const trackRect = track.getBoundingClientRect();
                const clickX = e.clientX - trackRect.left;
                const trackWidth = trackRect.width;
                const thumbWidth = (quickActionsScroll.thumbWidth / 100) * trackWidth;
                const maxScroll = container.scrollWidth - container.clientWidth;
                
                const newScrollLeft = (clickX / trackWidth) * maxScroll;
                container.scrollLeft = newScrollLeft;
              }}
            >
              <div 
                style={{
                  position: 'absolute',
                  top: 1,
                  bottom: 1,
                  borderRadius: 999,
                  background: PRIMARY,
                  width: `${quickActionsScroll.thumbWidth}%`,
                  left: `${quickActionsScroll.thumbOffset}%`,
                  transition: isDraggingThumb ? 'none' : 'left 0.2s ease, width 0.2s ease',
                  cursor: isDraggingThumb ? 'grabbing' : 'grab',
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                  touchAction: 'none'
                }}
                onMouseDown={handleThumbMouseDown}
                onTouchStart={handleThumbTouchStart}
              ></div>
            </div>

            <button
              onClick={() => scrollQuickActions(1)}
              disabled={!quickActionsScroll.canScrollRight}
              style={{
                width: 32,
                height: 32,
                borderRadius: 999,
                border: `1px solid ${PRIMARY}`,
                background: quickActionsScroll.canScrollRight ? '#fff' : '#f8dede',
                color: PRIMARY,
                cursor: quickActionsScroll.canScrollRight ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
                opacity: quickActionsScroll.canScrollRight ? 1 : 0.5
              }}
            >
              <ChevronRight size={16} strokeWidth={2.5} />
            </button>
          </div>
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
/>

{/* Details Modal */}
{openDetails && (
<div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
<div style={{ background: '#fff', borderRadius: 16, padding: 24, width: 720, maxWidth: '92vw', maxHeight: '80vh', overflowY: 'auto', boxShadow: '0 10px 30px #0003', fontFamily: FONT, position: 'relative' }}>
<button onClick={() => setOpenDetails(null)} style={{ position: 'absolute', top: 12, right: 12, background: 'none', border: 'none', cursor: 'pointer', color: PRIMARY }}>✕</button>
<div style={{ color: PRIMARY, fontWeight: 700, fontSize: 22, marginBottom: 8 }}>{openDetails.program_name}</div>
{openDetails.upload_photo && (
<div style={{ marginBottom: 12 }}>
<img src={`http://localhost:5000/uploads/${openDetails.upload_photo}`} alt="program" style={{ width: '100%', borderRadius: 8, border: '1px solid #eee', objectFit: 'cover', marginBottom: 12 }} />
</div>
)}
<div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16, fontSize: 14, color: '#333' }}>
<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Calendar size={16} color={PRIMARY} /><div>{formatDate(openDetails.date)}</div></div>
<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Clock size={16} color={PRIMARY} /><div>{formatTime(openDetails.time)}</div></div>
<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><MapPin size={16} color={PRIMARY} /><div>{openDetails.venue || '—'}</div></div>
{openDetails.department && (
<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><HeartHandshake size={16} color={PRIMARY} /><div>{openDetails.department}</div></div>
)}
<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><User size={16} color={PRIMARY} /><div>{openDetails.instructor || '—'}</div></div>
<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Users size={16} color={PRIMARY} /><div>{openDetails.max_participants || '—'} max participants</div></div>
<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Info size={16} color={PRIMARY} /><div>{openDetails.mode}</div></div>
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
style={{ background: '#f8f9fa', border: '1px solid #eee', borderRadius: 8, padding: 12 }}
dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(openDetails.description) }}
/>
</>
)}
</div>
</div>
)}
</div>
</div>
);
}

/* ------------------------------
TrainingDetailsCard component
- horizontal layout: left = info, right = bar chart
- banner spans both columns below
------------------------------ */
function TrainingDetailsCard({ programs }) {
const [currentIndex, setCurrentIndex] = useState(0);
const [details, setDetails] = useState(null);
const [stats, setStats] = useState({ pending: 0, approved: 0, declined: 0, total: 0 });
const [upcomingList, setUpcomingList] = useState(null);
const [visiblePrograms, setVisiblePrograms] = useState([]);
const chartRef = useRef(null);
const chartInstanceRef = useRef(null);
const chartContainerRef = useRef(null);
const [chartInitialized, setChartInitialized] = useState(false);
const navigate = useNavigate();

const hasRegistrationLink = (item) => Number(item?.register_link) === 1;

// Update visible programs list whenever programs or upcomingList changes
useEffect(() => {
const source = (upcomingList && upcomingList.length) ? upcomingList : programs;
if (!source || source.length === 0) {
setVisiblePrograms([]);
setDetails(null);
setStats({ pending: 0, approved: 0, declined: 0, total: 0 });
return;
}
// For admin view, show ALL programs (not filtered)
setVisiblePrograms(source);
}, [programs, upcomingList]);

// Load program when visible programs change (initial load)
useEffect(() => {
if (visiblePrograms.length === 0) {
setDetails(null);
setStats({ pending: 0, approved: 0, declined: 0, total: 0 });
return;
}
// Try to find a program with registrants first (prioritize it)
const findProgramWithRegistrants = async () => {
for (const prog of visiblePrograms) {
if (prog.id) {
try {
const sres = await fetch(`http://localhost:5000/api/home/training-programs/${prog.id}/registrations-stats`);
if (sres.ok) {
const sdata = await sres.json();
if (sdata && sdata.total > 0) {
// Found a program with registrants, load it
const idx = visiblePrograms.findIndex(p => p.id === prog.id);
if (idx !== -1) setCurrentIndex(idx);
loadProgram(prog.id);
return true; // Found and loaded
}
}
} catch (err) {
// Continue checking
}
}
}
return false; // Not found
};
findProgramWithRegistrants().then(found => {
if (!found) {
// If no program with registrants found, use first program
const idx = 0;
setCurrentIndex(idx);
const id = visiblePrograms[idx] && visiblePrograms[idx].id;
if (id) {
loadProgram(id);
}
}
});
// eslint-disable-next-line react-hooks/exhaustive-deps
}, [visiblePrograms]);

// Load program when current index changes (navigation)
useEffect(() => {
if (visiblePrograms.length === 0) return;
const idx = Math.min(currentIndex, visiblePrograms.length - 1);
const id = visiblePrograms[idx] && visiblePrograms[idx].id;
if (id) {
loadProgram(id);
}
// eslint-disable-next-line react-hooks/exhaustive-deps
}, [currentIndex]);

useEffect(() => {
const fetchUpcoming = async () => {
try {
const res = await fetch('http://localhost:5000/api/home/all-upcoming-events');
if (!res.ok) return;
const events = await res.json();
if (!events || events.length === 0) return;
setUpcomingList(events);
// The visiblePrograms effect will handle loading the program
} catch (err) {
console.error('Failed to fetch upcoming events for details card', err);
}
};
fetchUpcoming();
}, []);

// Fetch participants and compute counts so HomeAdmin matches TrainingProgress page
const loadRegistrationCountsFromParticipants = async (id) => {
try {
const res = await fetch(`http://localhost:5000/training-management/training-programs/${id}/participants`);
if (!res.ok) {
return false;
}
const data = await res.json();
const list = Array.isArray(data) ? data : [];
const total = list.length;
const pending = list.filter(r => r.progress_status === 'In Progress').length;
const approved = list.filter(r => r.progress_status === 'Completed').length;
const declined = list.filter(r => r.progress_status === 'Incomplete').length;
const statsObj = { total, pending, approved, declined };
setStats(statsObj);
updateChartFromStats(statsObj);
return true;
} catch (err) {
console.error('Failed to load participants for counts', err);
return false;
}
};

const loadProgram = async (id) => {
if (!id) return;
try {
const res = await fetch(`http://localhost:5000/api/home/training-programs/${id}`);
if (res.ok) {
const data = await res.json();
setDetails(data);
}
} catch (err) {
console.error('Failed to load program details', err);
}

// First try to compute counts from participants (same logic as TrainingProgress page)
const ok = await loadRegistrationCountsFromParticipants(id);
if (!ok) {
// Fallback to aggregated stats API if participants endpoint fails
try {
const sres = await fetch(`http://localhost:5000/api/home/training-programs/${id}/registrations-stats`);
if (sres.ok) {
const sdata = await sres.json();
setStats(sdata);
updateChartFromStats(sdata);
} else {
updateChartFromStats(null);
}
} catch (err) {
console.error('Failed to load registration stats', err);
}
}
};

const updateChart = (distribution) => {
import('chart.js/auto').then(({ default: Chart }) => {
const ctx = chartRef.current && chartRef.current.getContext('2d');
if (!ctx) return;
const labels = distribution.map(d => d.label);
const dataVals = distribution.map(d => d.count);
const palette = ['#6D2323', '#C97C5D', '#F2C14E', '#10B981', '#3B82F6', '#8B5CF6', '#EF4444', '#14B8A6', '#F59E0B', '#EC4899'];
const colors = dataVals.map((_, idx) => palette[idx % palette.length]);

if (chartInstanceRef.current) {
chartInstanceRef.current.destroy();
chartInstanceRef.current = null;
}

chartInstanceRef.current = new Chart(ctx, {
type: 'bar',
data: {
labels,
datasets: [{
label: 'Registrants',
data: dataVals,
backgroundColor: colors,
borderColor: colors,
borderWidth: 1
}]
},
options: {
responsive: true,
maintainAspectRatio: false,
resizeDelay: 0,
scales: {
x: { 
ticks: { maxRotation: 0, autoSkip: false },
grid: { display: false }
},
y: { 
beginAtZero: true, 
precision: 0,
grid: { display: true }
}
},
plugins: { legend: { display: false } },
animation: {
duration: 0 // Disable animations to prevent flickering
},
layout: {
padding: {
left: 0,
right: 0,
top: 0,
bottom: 0
}
}
}
});
setChartInitialized(true);
}).catch(err => console.error('Chart.js load error', err));
};

// Build a fixed 4-bar distribution for the chart
const updateChartFromStats = (statsData) => {
const s = statsData || {};
const distribution = [
{ label: 'Participants', count: s.total || 0 },
{ label: 'In Progress', count: s.pending || 0 },
{ label: 'Completed', count: s.approved || 0 },
{ label: 'Incomplete', count: s.declined || 0 }
];
updateChart(distribution);
};

// Handle window resize and container resize to maintain chart visibility
useEffect(() => {
const handleResize = () => {
if (chartInstanceRef.current && chartInitialized) {
chartInstanceRef.current.resize();
}
};

window.addEventListener('resize', handleResize);
// Use ResizeObserver to detect container size changes (e.g., when sidebar opens)
let resizeObserver = null;
if (chartContainerRef.current && window.ResizeObserver) {
resizeObserver = new ResizeObserver(() => {
if (chartInstanceRef.current && chartInitialized) {
// Small delay to ensure layout has settled
setTimeout(() => {
if (chartInstanceRef.current) {
chartInstanceRef.current.resize();
}
}, 50);
}
});
resizeObserver.observe(chartContainerRef.current);
}

return () => {
window.removeEventListener('resize', handleResize);
if (resizeObserver && chartContainerRef.current) {
resizeObserver.unobserve(chartContainerRef.current);
resizeObserver.disconnect();
}
};
}, [chartInitialized]);

const prev = () => {
if (!visiblePrograms || visiblePrograms.length === 0) return;
const prevIdx = (currentIndex - 1 + visiblePrograms.length) % visiblePrograms.length;
setCurrentIndex(prevIdx);
if (visiblePrograms[prevIdx] && visiblePrograms[prevIdx].id) {
loadProgram(visiblePrograms[prevIdx].id);
}
};
const next = () => {
if (!visiblePrograms || visiblePrograms.length === 0) return;
const nextIdx = (currentIndex + 1) % visiblePrograms.length;
setCurrentIndex(nextIdx);
if (visiblePrograms[nextIdx] && visiblePrograms[nextIdx].id) {
loadProgram(visiblePrograms[nextIdx].id);
}
};

const program = visiblePrograms[currentIndex] || null;

return (
<div style={{ 
background: '#fff', 
borderRadius: 10, 
border: `2px solid ${PRIMARY}`, 
padding: 10, 
cursor: details ? 'pointer' : 'default',
flex: 1,
display: 'flex',
flexDirection: 'column',
minHeight: 420, // Set minimum height to match quick actions
minWidth: 0, // Allow flex item to shrink below content size
width: '100%',
maxWidth: '100%',
boxSizing: 'border-box'
}} onClick={() => { 
if (details) {
navigate('/dashboard_admin/registration-status-update', { state: { selectedProgram: details } });
} 
}}>
{/* Header with title and navigation arrows */}
<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', marginBottom: 8 }}>
<button onClick={(e) => { e.stopPropagation(); prev(); }} style={{ position: 'absolute', left: 0, background: 'none', border: 'none', cursor: 'pointer', color: PRIMARY, fontSize: 20, fontWeight: 700 }}>◀</button>
<div style={{ fontWeight: 700, color: PRIMARY, fontSize: 18, textAlign: 'center' }}>{details?.program_name || program?.program_name || 'No Program Selected'}</div>
<button onClick={(e) => { e.stopPropagation(); next(); }} style={{ position: 'absolute', right: 0, background: 'none', border: 'none', cursor: 'pointer', color: PRIMARY, fontSize: 20, fontWeight: 700 }}>▶</button>
</div>

{/* Total Registrants and Bar Chart - Above banner */}
<div style={{ display: 'flex', alignItems: 'stretch', gap: 10, marginBottom: 8, minWidth: 0, width: '100%' }}>
<div style={{ minWidth: 130, flexShrink: 0, color: PRIMARY }}>
<div style={{ fontWeight: 600, fontSize: 13 }}>Total Registrants: {stats.total || 0}</div>
<div style={{ marginTop: 2, fontSize: 13, fontWeight: 600 }}>In Progress: {stats.pending || 0}</div>
<div style={{ fontSize: 13, fontWeight: 600 }}>Completed: {stats.approved || 0}</div>
<div style={{ fontSize: 13, fontWeight: 600 }}>Incomplete: {stats.declined || 0}</div>
</div>
<div ref={chartContainerRef} style={{ flex: 1, height: 150, position: 'relative', minWidth: 0, maxWidth: '100%', overflow: 'hidden' }}>
{(stats.total || stats.pending || stats.approved || stats.declined) ? (
<canvas ref={chartRef} style={{ width: '100%', height: '100%', maxWidth: '100%' }} />
 ) : (
<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', color: PRIMARY, fontSize: 14 }}>
No data
</div>
)}
</div>
</div>

{/* Banner and Details Side by Side */}
<div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 10, alignItems: 'start', marginTop: 'auto' }}>
{/* Left: Banner Image */}
<div>
<img
src={details?.upload_photo ? `http://localhost:5000/uploads/${details.upload_photo}` : `http://localhost:5000/uploads/program/blank_image.png`}
alt="Program banner"
style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: 8, border: '1px solid #eee' }}
/>
</div>

{/* Right: Workshop Details */}
<div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
{details ? (
<>
<div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
<Calendar size={16} color={PRIMARY} />
<div style={{ fontSize: 13, color: '#333' }}>{details.date ? formatDate(details.date) : '—'}</div>
</div>
<div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
<Clock size={16} color={PRIMARY} />
<div style={{ fontSize: 13, color: '#333' }}>{details.time ? formatTime(details.time) : '—'}</div>
</div>
<div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
<MapPin size={16} color={PRIMARY} />
<div style={{ fontSize: 13, color: '#333' }}>{details.venue || '—'}</div>
</div>
{details.department && (
<div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
<HeartHandshake size={16} color={PRIMARY} />
<div style={{ fontSize: 13, color: '#333' }}>{details.department}</div>
</div>
)}
<div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
<User size={16} color={PRIMARY} />
<div style={{ fontSize: 13, color: '#333' }}>{details.instructor || '—'}</div>
</div>
<div style={{ display: 'flex', alignItems: 'center', gap: 1 }}>
<UserPlus size={16} color={PRIMARY} />
<div style={{ fontSize: 13, color: '#333' }}>Max {details.max_participants || '—'} participants</div>
</div>
<div style={{ marginTop: 4 }}>
<div style={{ backgroundColor: '#e3f2fd', color: '#1976d2', padding: '4px 10px', borderRadius: '20px', fontSize: 11, fontWeight: 600, display: 'inline-block' }}>{details.mode || '—'}</div>
</div>
</>
) : <div style={{ fontSize: 13, color: '#666' }}>Loading...</div>}
</div>
</div>
</div>
);
}

/* QuickActionButton component */
function QuickActionButton({ icon, label, onClick }) {
return (
<button onClick={onClick} style={{
display: 'flex',
flexDirection: 'column',
alignItems: 'center',
gap: 6,
justifyContent: 'center',
background: '#fff',
borderRadius: 12,
padding: '12px 16px',
border: `2px solid ${PRIMARY}`,
boxShadow: '0 2px 6px rgba(109,35,35,0.12)',
cursor: 'pointer',
fontFamily: FONT,
fontWeight: 600,
color: PRIMARY,
      minHeight: '86px',
      minWidth: 'calc(50% - 4px)',
      flex: '0 0 calc(50% - 4px)',
scrollSnapAlign: 'start',
scrollSnapStop: 'always',
transition: 'transform 0.2s ease, box-shadow 0.2s ease'
}}>
<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: PRIMARY }}>
{icon}
</div>
<div style={{ fontSize: 12, textAlign: 'center', color: PRIMARY }}>{label}</div>
</button>
);
}

/* SmallCalendar component (clean modern) */
function SmallCalendar() {
const now = new Date();
const [viewYear, setViewYear] = useState(now.getFullYear());
const [viewMonth, setViewMonth] = useState(now.getMonth());

useEffect(() => {
setViewYear(now.getFullYear());
setViewMonth(now.getMonth());
}, []);

const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay();
const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
const weeks = [];
let dayCounter = 1 - firstDayOfMonth;
for (let week = 0; week < 6; week++) {
const days = [];
for (let d = 0; d < 7; d++, dayCounter++) {
if (dayCounter < 1 || dayCounter > daysInMonth) {
days.push(null);
} else {
days.push(dayCounter);
}
}
weeks.push(days);
if (dayCounter > daysInMonth) break;
}

const monthName = new Date(viewYear, viewMonth).toLocaleString('en-US', { month: 'long' });
const today = new Date();

return (
<div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
{/* Header with month name and navigation arrows */}
<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', marginBottom: 6 }}>
<button onClick={() => { const prev = new Date(viewYear, viewMonth - 1, 1); setViewYear(prev.getFullYear()); setViewMonth(prev.getMonth()); }} style={{ position: 'absolute', left: 0, background: 'none', border: 'none', cursor: 'pointer', color: PRIMARY, fontSize: 16, fontWeight: 700 }}>◀</button>
<div style={{ fontWeight: 700, color: PRIMARY, fontSize: 16 }}>{monthName}</div>
<button onClick={() => { const next = new Date(viewYear, viewMonth + 1, 1); setViewYear(next.getFullYear()); setViewMonth(next.getMonth()); }} style={{ position: 'absolute', right: 0, background: 'none', border: 'none', cursor: 'pointer', color: PRIMARY, fontSize: 16, fontWeight: 700 }}>▶</button>
</div>

{/* Day labels */}
<div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, textAlign: 'center', fontSize: 10, color: PRIMARY, fontWeight: 700, marginBottom: 2 }}>
{['S','M','T','W','TH','F','S'].map((s) => <div key={s}>{s}</div>)}
</div>

{/* Calendar grid */}
<div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
{weeks.flat().map((d, idx) => {
const isToday = d && viewYear === today.getFullYear() && viewMonth === today.getMonth() && d === today.getDate();
return (
<div key={idx} style={{
minHeight: 22, display: 'flex', alignItems: 'center', justifyContent: 'center',
borderRadius: 4, background: d ? '#fff' : 'transparent', border: d ? '1px solid #ddd' : 'none',
fontWeight: isToday ? 700 : 500, color: isToday ? PRIMARY : '#333', fontSize: 11
}}>
{d || ''}
</div>
);
})}
</div>
</div>
);
}