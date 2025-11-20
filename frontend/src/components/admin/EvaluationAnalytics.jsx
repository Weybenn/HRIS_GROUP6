import { useState, useEffect } from 'react';
import { ArrowLeft, Users, FileText, TrendingUp } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const FONT = 'Poppins, sans-serif';
const TEXT_COLOR = '#6D2323';
const CARD_BG = '#FEF9E1';
const BORDER_COLOR = '#6D2323';

export default function EvaluationAnalytics() {
  const navigate = useNavigate();
  const location = useLocation();
  const selectedProgram = location.state?.selectedProgram;
  
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (selectedProgram) {
      fetchAnalyticsData(selectedProgram.id);
    }
  }, [selectedProgram]);

  const fetchAnalyticsData = async (programId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/evaluation/evaluation-management/analytics/${programId}`);
      if (response.ok) {
        const data = await response.json();
        setAnalyticsData(data);
      } else {
        console.error('Failed to fetch analytics data');
      }
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBackClick = () => {
    navigate('/dashboard_admin/evaluation-management');
  };

  const formatTimeToAmPm = (timeString) => {
    if (!timeString) return 'TBA';
    const parts = String(timeString).split(':');
    const hours24 = Number(parts[0]);
    const minutes = Number(parts[1]);
    if (Number.isNaN(hours24) || Number.isNaN(minutes)) return String(timeString);
    const ampm = hours24 >= 12 ? 'PM' : 'AM';
    const hours12 = ((hours24 % 12) || 12);
    return `${hours12}:${String(minutes).padStart(2, '0')} ${ampm}`;
  };

  const getSatisfactionColor = (rating) => {
    if (rating >= 4) return '#10B981';
    if (rating >= 3) return '#F59E0B';
    return '#EF4444';
  };

  const getSatisfactionLabel = (rating) => {
    if (rating >= 4.5) return 'Very Satisfied';
    if (rating >= 3.5) return 'Satisfied';
    if (rating >= 2.5) return 'Neutral';
    if (rating >= 1.5) return 'Dissatisfied';
    return 'Very Dissatisfied';
  };


  if (!selectedProgram) {
    return (
      <div style={{ fontFamily: FONT, minHeight: '100vh', padding: '0 2rem 2rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 18, color: '#000000' }}>No program selected</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ fontFamily: FONT, minHeight: '100vh', padding: '0 2rem 2rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 18, color: '#000000' }}>Loading analytics data...</div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: FONT, minHeight: '100vh', padding: '0 2rem 2rem 2rem' }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
          <button
            onClick={handleBackClick}
            style={{ background: 'none', border: 'none', cursor: 'pointer', marginRight: 16 }}
            aria-label="Back to evaluation management"
          >
            <ArrowLeft color="#6D2323" size={32} />
          </button>
          <h1 style={{ color: '#6D2323', fontWeight: 700, fontSize: 32, margin: 0 }}>
            {selectedProgram.program_name}
          </h1>
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Program Overview styled like RegistrationStatusUpdate */}
        <div style={{ marginBottom: 24, padding: 16, background: '#FEF9E1', borderRadius: 8, border: '1px solid #e9ecef' }}>
          {/* Program Details Grid */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(3, 1fr)', 
            gap: '16px'
          }}>
            {/* Column 1: Date and Time */}
            <div style={{ background: 'white', padding: '12px', borderRadius: '6px', border: '1px solid #e9ecef', textAlign: 'center' }}>
              <div style={{ fontSize: '12px', color: '#000000', marginBottom: '4px', fontFamily: FONT, fontWeight: '600' }}>DATE & TIME</div>
              <div style={{ fontSize: '14px', color: '#6D2323', fontFamily: FONT, fontWeight: '600' }}>
                {new Date(selectedProgram.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
              </div>
              <div style={{ fontSize: '12px', color: '#000000', fontFamily: FONT }}>{formatTimeToAmPm(selectedProgram.time)}</div>
            </div>

            {/* Column 2: Venue and Instructor */}
            <div style={{ background: 'white', padding: '12px', borderRadius: '6px', border: '1px solid #e9ecef', textAlign: 'center' }}>
              <div style={{ fontSize: '12px', color: '#000000', marginBottom: '4px', fontFamily: FONT, fontWeight: '600' }}>VENUE & INSTRUCTOR</div>
              <div style={{ fontSize: '14px', color: '#6D2323', fontFamily: FONT, fontWeight: '600', marginBottom: '2px' }}>{selectedProgram.venue || 'TBA'}</div>
              <div style={{ fontSize: '12px', color: '#000000', fontFamily: FONT }}>{selectedProgram.instructor || 'TBA'}</div>
            </div>

            {/* Column 3: Mode and Capacity */}
            <div style={{ background: 'white', padding: '12px', borderRadius: '6px', border: '1px solid #e9ecef', textAlign: 'center' }}>
              <div style={{ fontSize: '12px', color: '#000000', marginBottom: '4px', fontFamily: FONT, fontWeight: '600' }}>MODE & CAPACITY</div>
              <div style={{ fontSize: '14px', color: '#6D2323', fontFamily: FONT, fontWeight: '600', marginBottom: '2px' }}>{selectedProgram.mode}</div>
              <div style={{ fontSize: '12px', color: '#000000', fontFamily: FONT }}>Participants: {selectedProgram.max_participants || 'Unlimited'}</div>
            </div>
          </div>
        </div>

        {/* Summary Cards Section */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
          <div style={{ backgroundColor: CARD_BG, borderRadius: '12px', padding: '24px', border: `2px solid ${BORDER_COLOR}`, textAlign: 'center' }}>
            <Users size={32} color={TEXT_COLOR} style={{ marginBottom: '12px' }} />
            <div style={{ color: '#000000', fontSize: '32px', fontWeight: '700', margin: '0 0 8px 0', fontFamily: FONT }}>
              {analyticsData?.totalParticipants || 0}
            </div>
            <div style={{ color: TEXT_COLOR, fontSize: '16px', fontWeight: '600', fontFamily: FONT }}>
              Total Participants
            </div>
          </div>

          <div style={{ backgroundColor: CARD_BG, borderRadius: '12px', padding: '24px', border: `2px solid ${BORDER_COLOR}`, textAlign: 'center' }}>
            <FileText size={32} color={TEXT_COLOR} style={{ marginBottom: '12px' }} />
            <div style={{ color: '#000000', fontSize: '32px', fontWeight: '700', margin: '0 0 8px 0', fontFamily: FONT }}>
              {analyticsData?.submittedEvaluations || 0}
            </div>
            <div style={{ color: TEXT_COLOR, fontSize: '16px', fontWeight: '600', fontFamily: FONT }}>
              Evaluations Submitted
            </div>
          </div>

          <div style={{ backgroundColor: CARD_BG, borderRadius: '12px', padding: '24px', border: `2px solid ${BORDER_COLOR}`, textAlign: 'center' }}>
            <TrendingUp size={32} color={TEXT_COLOR} style={{ marginBottom: '12px' }} />
            <div style={{ 
              color: analyticsData?.overallSatisfaction ? getSatisfactionColor(analyticsData.overallSatisfaction) : '#000000', 
              fontSize: '32px', 
              fontWeight: '700', 
              margin: '0 0 8px 0', 
              fontFamily: FONT 
            }}>
              {analyticsData?.overallSatisfaction ? `${analyticsData.overallSatisfaction.toFixed(1)}/5.0` : 'N/A'}
            </div>
            <div style={{ color: TEXT_COLOR, fontSize: '16px', fontWeight: '600', fontFamily: FONT }}>
              Overall Satisfaction
            </div>
          </div>
        </div>

        {/* Detailed Content Section */}
        {analyticsData?.questionAnalytics && analyticsData.questionAnalytics.length > 0 ? (
          <div>
            <h2 style={{ color: TEXT_COLOR, fontSize: '24px', fontWeight: '600', margin: '0 0 24px 0', fontFamily: FONT }}>
              Evaluation Questions Breakdown
            </h2>
            
            <div style={{ backgroundColor: CARD_BG, borderRadius: '12px', padding: '32px', border: `2px solid ${BORDER_COLOR}`, marginBottom: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '32px' }}>
                {analyticsData.questionAnalytics.map((question, index) => {
                  const raw = (question.question || '').trim();
                  const parts = raw.split('—');
                  const title = (parts[0] || raw).trim();
                  const description = (parts[1] || '').trim();
                  return (
                  <div key={index} style={{
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    padding: '24px',
                    border: '1px solid #e5e5e5'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
                      <div style={{ color: '#111827', fontWeight: 600, fontSize: 16 }}>{index + 1}.</div>
                      <div style={{ color: '#111827', fontWeight: 600, fontSize: 16 }}>{title}</div>
                    </div>
                    {description && (
                      <div style={{ color: '#374151', fontSize: 13, marginBottom: 12 }}>
                        {description}
                      </div>
                    )}
                    
                    {/* Average Rating */}
                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ color: '#000000', fontSize: '14px', fontFamily: FONT }}>Average Rating:</span>
                        <span style={{ 
                          color: getSatisfactionColor(question.averageRating), 
                          fontSize: '18px', 
                          fontWeight: '700', 
                          fontFamily: FONT 
                        }}>
                          {question.averageRating.toFixed(1)}/5.0
                        </span>
                      </div>
                      <div style={{ 
                        backgroundColor: '#f3f4f6', 
                        borderRadius: '8px', 
                        height: '8px', 
                        overflow: 'hidden' 
                      }}>
                        <div style={{ 
                          backgroundColor: getSatisfactionColor(question.averageRating), 
                          height: '100%', 
                          width: `${(question.averageRating / 5) * 100}%`,
                          transition: 'width 0.3s ease'
                        }} />
                      </div>
                    </div>

                    {/* Response Distribution */}
                    <div>
                      <h4 style={{ color: TEXT_COLOR, fontSize: '16px', fontWeight: '600', margin: '0 0 12px 0', fontFamily: FONT }}>
                        Response Distribution
                      </h4>
                      {question.distribution.map((count, rating) => (
                        <div key={rating} style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{ 
                            color: '#000000', 
                            fontSize: '12px', 
                            fontFamily: FONT, 
                            width: '20px' 
                          }}>
                            {rating + 1}
                          </span>
                          <div style={{ 
                            backgroundColor: '#f3f4f6', 
                            borderRadius: '4px', 
                            height: '20px', 
                            flex: 1, 
                            margin: '0 8px',
                            overflow: 'hidden'
                          }}>
                            <div style={{ 
                              backgroundColor: '#6D2323', 
                              height: '100%', 
                              width: `${question.totalResponses > 0 ? (count / question.totalResponses) * 100 : 0}%`,
                              transition: 'width 0.3s ease'
                            }} />
                          </div>
                          <span style={{ 
                            color: '#000000', 
                            fontSize: '12px', 
                            fontFamily: FONT, 
                            width: '30px',
                            textAlign: 'right'
                          }}>
                            {count}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div style={{
            backgroundColor: CARD_BG,
            borderRadius: '12px',
            padding: '40px',
            border: `2px solid ${BORDER_COLOR}`,
            textAlign: 'center'
          }}>
            <h3 style={{ color: '#000000', fontSize: '20px', fontWeight: '600', margin: '0 0 8px 0', fontFamily: FONT }}>
              No Evaluation Data Available
            </h3>
            <p style={{ color: '#000000', fontSize: '16px', margin: '0', fontFamily: FONT }}>
              No participants have submitted evaluation forms for this training program yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}