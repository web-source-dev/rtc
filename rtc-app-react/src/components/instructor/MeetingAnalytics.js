import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faChalkboardTeacher, 
  faChartLine, 
  faCalendarAlt, 
  faClock, 
  faUsers,
  faEye,
  faArrowLeft,
  faUserGraduate,
  faEyeSlash,
  faUserSlash,
  faMoon,
  faBed,
  faMask,
  faSignOutAlt,
  faDownload
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../context/AuthContext';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Filler } from 'chart.js';
import { Pie, Bar, Line } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  ArcElement, 
  Tooltip, 
  Legend, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  PointElement, 
  LineElement,
  Title,
  Filler
);

const MeetingAnalytics = () => {
  const { id } = useParams();
  const [meeting, setMeeting] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTab, setSelectedTab] = useState('overview');
  
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Redirect if user is not an instructor
  useEffect(() => {
    if (user && user.role !== 'instructor') {
      navigate('/');
    }
  }, [user, navigate]);
  
  // Fetch meeting and analytics data
  useEffect(() => {
    const fetchMeetingData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch meeting details
        const meetingResponse = await fetch(`/api/meetings/${id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (!meetingResponse.ok) {
          const data = await meetingResponse.json();
          throw new Error(data.message || 'Failed to fetch meeting details');
        }
        
        const meetingData = await meetingResponse.json();
        setMeeting(meetingData.data);
        
        // Fetch analytics
        const analyticsResponse = await fetch(`/api/meetings/${id}/analytics`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (!analyticsResponse.ok) {
          const data = await analyticsResponse.json();
          throw new Error(data.message || 'Failed to fetch analytics data');
        }
        
        const analyticsData = await analyticsResponse.json();
        setAnalytics(analyticsData.data);
        
      } catch (error) {
        console.error('Error fetching data:', error);
        setError(error.message || 'Failed to fetch data');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchMeetingData();
  }, [id]);
  
  // Helper function to format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  // Helper function to format time
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Format duration in seconds to human readable format
  const formatDuration = (seconds) => {
    if (!seconds || isNaN(seconds) || seconds < 0) {
      return '0s';
    }
    
    // Cap at 2 hours to prevent unreasonable values
    const MAX_DURATION = 2 * 60 * 60;
    if (seconds > MAX_DURATION) {
      seconds = MAX_DURATION;
    }
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    let result = '';
    if (hours > 0) {
      result += `${hours}h `;
    }
    if (minutes > 0 || hours > 0) {
      result += `${minutes}m `;
    }
    if (remainingSeconds > 0 || (hours === 0 && minutes === 0)) {
      result += `${remainingSeconds}s`;
    }
    
    return result.trim();
  };
  
  // Format percentage with 2 decimal places
  const formatPercentage = (value) => {
    if (typeof value !== 'number' || isNaN(value)) {
      return '0%';
    }
    return `${Math.min(100, Math.max(0, value)).toFixed(2)}%`;
  };
  
  // Get attention state icon
  const getAttentionStateIcon = (state) => {
    switch (state) {
      case 'attentive':
        return <FontAwesomeIcon icon={faEye} className="text-success" />;
      case 'active':
        return <FontAwesomeIcon icon={faEye} className="text-primary" />;
      case 'looking_away':
        return <FontAwesomeIcon icon={faEyeSlash} className="text-warning" />;
      case 'drowsy':
        return <FontAwesomeIcon icon={faMoon} className="text-warning" />;
      case 'sleeping':
        return <FontAwesomeIcon icon={faBed} className="text-danger" />;
      case 'absent':
        return <FontAwesomeIcon icon={faUserSlash} className="text-danger" />;
      case 'darkness':
        return <FontAwesomeIcon icon={faMask} className="text-secondary" />;
      default:
        return <FontAwesomeIcon icon={faEye} className="text-secondary" />;
    }
  };
  
  // Get color for attention state
  const getAttentionStateColor = (state) => {
    switch (state) {
      case 'attentive':
        return 'rgba(40, 167, 69, 0.8)';
      case 'active':
        return 'rgba(0, 123, 255, 0.8)';
      case 'looking_away':
        return 'rgba(255, 193, 7, 0.8)';
      case 'drowsy':
        return 'rgba(255, 180, 0, 0.8)';
      case 'sleeping':
        return 'rgba(220, 53, 69, 0.8)';
      case 'absent':
        return 'rgba(220, 53, 69, 0.8)';
      case 'darkness':
        return 'rgba(108, 117, 125, 0.8)';
      default:
        return 'rgba(108, 117, 125, 0.8)';
    }
  };
  
  // Format state name for display
  const formatStateName = (state) => {
    if (!state) return 'Unknown';
    
    switch (state) {
      case 'attentive':
        return 'Attentive';
      case 'active':
        return 'Active';
      case 'looking_away':
        return 'Looking Away';
      case 'drowsy':
        return 'Drowsy';
      case 'sleeping':
        return 'Sleeping';
      case 'absent':
        return 'Absent';
      case 'darkness':
        return 'In Darkness';
      default:
        return state
          .replace(/_/g, ' ')
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
    }
  };
  
  // Prepare chart data for attention distribution
  const prepareAttentionDistributionData = () => {
    if (!analytics) return null;
    
    const states = ['attentive', 'active', 'looking_away', 'drowsy', 'sleeping', 'absent', 'darkness'];
    const labels = states.map(formatStateName);
    const data = states.map(state => analytics.attentionStates[state] || 0);
    const backgroundColor = states.map(getAttentionStateColor);
    
    return {
      labels,
      datasets: [
        {
          data,
          backgroundColor,
          borderColor: backgroundColor.map(color => color.replace('0.8', '1')),
          borderWidth: 1
        }
      ]
    };
  };
  
  // Prepare time series data for attention over time
  const prepareTimeSeriesData = () => {
    if (!analytics || !analytics.timeSeriesData || analytics.timeSeriesData.length === 0) {
      return null;
    }
    
    const timestamps = analytics.timeSeriesData.map(point => {
      const date = new Date(point.timestamp);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    });
    
    const states = ['attentive', 'active', 'looking_away', 'drowsy', 'sleeping', 'absent', 'darkness'];
    
    const datasets = states.map(state => {
      const color = getAttentionStateColor(state);
      
      return {
        label: formatStateName(state),
        data: analytics.timeSeriesData.map(point => point[state] || 0),
        borderColor: color,
        backgroundColor: color.replace('0.8', '0.2'),
        fill: false,
        tension: 0.4,
        pointRadius: 2,
        borderWidth: 2
      };
    });
    
    return {
      labels: timestamps,
      datasets
    };
  };
  
  // Prepare participant data for bar chart
  const prepareParticipantData = () => {
    if (!analytics || !analytics.participantData || analytics.participantData.length === 0) {
      return null;
    }
    
    // Sort participants by attention percentage
    const sortedParticipants = [...analytics.participantData]
      .sort((a, b) => b.attentionPercentage - a.attentionPercentage);
    
    const labels = sortedParticipants.map(p => p.name);
    const data = sortedParticipants.map(p => p.attentionPercentage);
    
    // Determine colors based on attention percentage
    const backgroundColor = data.map(value => {
      if (value >= 70) return 'rgba(40, 167, 69, 0.8)';
      if (value >= 40) return 'rgba(255, 193, 7, 0.8)';
      return 'rgba(220, 53, 69, 0.8)';
    });
    
    return {
      labels,
      datasets: [
        {
          label: 'Attention Percentage',
          data,
          backgroundColor,
          borderColor: backgroundColor.map(color => color.replace('0.8', '1')),
          borderWidth: 1
        }
      ]
    };
  };
  
  // Calculate total times for each state across all participants
  const calculateTotalTimes = () => {
    if (!analytics || !analytics.participantData) return {};
    
    const states = ['attentive', 'active', 'looking_away', 'drowsy', 'sleeping', 'absent', 'darkness'];
    const totals = {};
    
    states.forEach(state => {
      totals[state] = analytics.participantData.reduce((sum, participant) => {
        // Ensure we're adding a valid number
        const stateValue = participant.attentionData?.[state];
        if (typeof stateValue === 'number' && !isNaN(stateValue)) {
          return sum + Math.max(0, stateValue); // Ensure non-negative
        }
        return sum;
      }, 0);
    });
    
    // Cap extremely large values
    const MAX_SECONDS = 24 * 60 * 60; // 24 hours
    Object.keys(totals).forEach(state => {
      if (totals[state] > MAX_SECONDS) {
        console.warn(`Capping excessive ${state} time: ${totals[state]}s -> ${MAX_SECONDS}s`);
        totals[state] = MAX_SECONDS;
      }
    });
    
    return totals;
  };
  
  const attentionDistributionData = prepareAttentionDistributionData();
  const timeSeriesData = prepareTimeSeriesData();
  const participantData = prepareParticipantData();
  const totalTimes = calculateTotalTimes();
  
  // Export analytics to CSV
  const exportToCSV = () => {
    if (!analytics || !meeting) return;
    
    // Create CSV content
    let csvContent = "data:text/csv;charset=utf-8,";
    
    // Add header row
    csvContent += "Meeting Analytics: " + meeting.title + "\r\n";
    csvContent += "Date: " + formatDate(meeting.startTime) + "\r\n";
    csvContent += "Time: " + formatTime(meeting.startTime) + " - " + (meeting.endTime ? formatTime(meeting.endTime) : "Ongoing") + "\r\n\r\n";
    
    // Overall stats
    csvContent += "OVERALL STATISTICS\r\n";
    csvContent += "Total Participants," + analytics.participantCount + "\r\n";
    csvContent += "Average Attention," + (analytics.overview.averageAttention || 0).toFixed(2) + "%\r\n";
    csvContent += "Duration," + formatDuration(analytics.duration) + "\r\n\r\n";
    
    // Attention state totals
    csvContent += "ATTENTION STATES (SECONDS)\r\n";
    csvContent += "Attentive," + (totalTimes.attentive || 0) + "\r\n";
    csvContent += "Active," + (totalTimes.active || 0) + "\r\n";
    csvContent += "Looking Away," + (totalTimes.looking_away || 0) + "\r\n";
    csvContent += "Drowsy," + (totalTimes.drowsy || 0) + "\r\n";
    csvContent += "Sleeping," + (totalTimes.sleeping || 0) + "\r\n";
    csvContent += "Absent," + (totalTimes.absent || 0) + "\r\n";
    csvContent += "Darkness," + (totalTimes.darkness || 0) + "\r\n\r\n";
    
    // Participant data
    csvContent += "PARTICIPANT DATA\r\n";
    csvContent += "Name,Attention %,Join Time,Leave Time,Attentive (s),Active (s),Looking Away (s),Drowsy (s),Sleeping (s),Absent (s),Darkness (s)\r\n";
    
    analytics.participantData.forEach(participant => {
      const joinTime = participant.joinTime ? formatTime(participant.joinTime) : "N/A";
      const leaveTime = participant.leaveTime ? formatTime(participant.leaveTime) : "N/A";
      
      csvContent += [
        participant.name,
        participant.attentionPercentage.toFixed(2),
        joinTime,
        leaveTime,
        participant.attentionData.attentive || 0,
        participant.attentionData.active || 0,
        participant.attentionData.looking_away || 0,
        participant.attentionData.drowsy || 0,
        participant.attentionData.sleeping || 0,
        participant.attentionData.absent || 0,
        participant.attentionData.darkness || 0
      ].join(",") + "\r\n";
    });
    
    // Create download link
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `meeting_analytics_${meeting._id}.csv`);
    document.body.appendChild(link);
    
    // Trigger download
    link.click();
    document.body.removeChild(link);
  };
  
  if (isLoading) {
    return (
      <div className="d-flex flex-column min-vh-100" style={{ backgroundColor: '#323248' }}>
        <header className="p-3" style={{ backgroundColor: '#252536', borderBottom: '1px solid #454564' }}>
          <div className="container">
            <div className="d-flex align-items-center">
              <Link to="/instructor/dashboard" className="me-3" style={{ color: '#e0e0e0' }}>
                <FontAwesomeIcon icon={faArrowLeft} />
              </Link>
              <h1 className="h4 mb-0" style={{ color: '#e0e0e0' }}>Meeting Analytics</h1>
            </div>
          </div>
        </header>
        
        <main className="container py-5 flex-grow-1 text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3" style={{ color: '#e0e0e0' }}>Loading analytics data...</p>
        </main>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="d-flex flex-column min-vh-100" style={{ backgroundColor: '#323248' }}>
        <header className="p-3" style={{ backgroundColor: '#252536', borderBottom: '1px solid #454564' }}>
          <div className="container">
            <div className="d-flex align-items-center">
              <Link to="/instructor/dashboard" className="me-3" style={{ color: '#e0e0e0' }}>
                <FontAwesomeIcon icon={faArrowLeft} />
              </Link>
              <h1 className="h4 mb-0" style={{ color: '#e0e0e0' }}>Error</h1>
            </div>
          </div>
        </header>
        
        <main className="container py-5 flex-grow-1">
          <div className="alert alert-danger">
            {error}
          </div>
          <Link to="/instructor/dashboard" className="btn btn-primary">
            Back to Dashboard
          </Link>
        </main>
      </div>
    );
  }
  
  if (!meeting || !analytics) {
    return (
      <div className="d-flex flex-column min-vh-100" style={{ backgroundColor: '#323248' }}>
        <header className="p-3" style={{ backgroundColor: '#252536', borderBottom: '1px solid #454564' }}>
          <div className="container">
            <div className="d-flex align-items-center">
              <Link to="/instructor/dashboard" className="me-3" style={{ color: '#e0e0e0' }}>
                <FontAwesomeIcon icon={faArrowLeft} />
              </Link>
              <h1 className="h4 mb-0" style={{ color: '#e0e0e0' }}>Meeting Not Found</h1>
            </div>
          </div>
        </header>
        
        <main className="container py-5 flex-grow-1">
          <div className="alert alert-warning">
            Meeting data not found or could not be loaded.
          </div>
          <Link to="/instructor/dashboard" className="btn btn-primary">
            Back to Dashboard
          </Link>
        </main>
      </div>
    );
  }
  
  return (
    <div className="d-flex flex-column min-vh-100" style={{ backgroundColor: '#323248' }}>
      {/* Header */}
      <header className="p-3" style={{ backgroundColor: '#252536', borderBottom: '1px solid #454564' }}>
        <div className="container">
          <div className="d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center">
              <Link to="/instructor/dashboard" className="me-3" style={{ color: '#e0e0e0' }}>
                <FontAwesomeIcon icon={faArrowLeft} />
              </Link>
              <FontAwesomeIcon 
                icon={faChartLine} 
                className="me-3"
                style={{ fontSize: '1.5rem', color: '#3949AB' }}
              />
              <div>
                <h1 className="h4 mb-0" style={{ color: '#e0e0e0' }}>{meeting.title}</h1>
                <div className="text-muted small">Class ID: {meeting.roomId}</div>
              </div>
            </div>
            
            <div className="d-flex align-items-center">
              <button 
                className="btn btn-sm me-3"
                style={{ backgroundColor: '#3949AB', display: 'none', color: '#ffffff' }}
                onClick={exportToCSV}
              >
                <FontAwesomeIcon icon={faDownload} className="me-1" />
                Export CSV
              </button>
            </div>
          </div>
        </div>
      </header>
      
      {/* Main content */}
      <main className="container py-4 flex-grow-1">
        {/* Meeting info */}
        <div className="card mb-4" style={{ backgroundColor: '#252536', borderColor: '#454564' }}>
          <div className="card-body">
            <div className="row">
              <div className="col-md-3 mb-3 mb-md-0">
                <div className="text-muted mb-1">Date</div>
                <div style={{ color: '#e0e0e0' }}>
                  <FontAwesomeIcon icon={faCalendarAlt} className="me-2" />
                  {formatDate(meeting.startTime)}
                </div>
              </div>
              
              <div className="col-md-3 mb-3 mb-md-0">
                <div className="text-muted mb-1">Time</div>
                <div style={{ color: '#e0e0e0' }}>
                  <FontAwesomeIcon icon={faClock} className="me-2" />
                  {formatTime(meeting.startTime)} - {meeting.endTime ? formatTime(meeting.endTime) : 'Ongoing'}
                </div>
              </div>
              
              <div className="col-md-3 mb-3 mb-md-0">
                <div className="text-muted mb-1">Duration</div>
                <div style={{ color: '#e0e0e0' }}>
                  {formatDuration(analytics.duration)}
                </div>
              </div>
              
              <div className="col-md-3">
                <div className="text-muted mb-1">Participants</div>
                <div style={{ color: '#e0e0e0' }}>
                  <FontAwesomeIcon icon={faUsers} className="me-2" />
                  {analytics.participantCount}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Navigation tabs */}
        <ul className="nav nav-tabs mb-4">
          <li className="nav-item">
            <button 
              className={`nav-link ${selectedTab === 'overview' ? 'active' : ''}`}
              onClick={() => setSelectedTab('overview')}
              style={{ 
                backgroundColor: selectedTab === 'overview' ? '#3949AB' : 'transparent',
                color: selectedTab === 'overview' ? '#ffffff' : '#adb5bd',
                border: 'none'
              }}
            >
              Overview
            </button>
          </li>
          <li className="nav-item">
            <button 
              className={`nav-link ${selectedTab === 'timeline' ? 'active' : ''}`}
              onClick={() => setSelectedTab('timeline')}
              style={{ 
                backgroundColor: selectedTab === 'timeline' ? '#3949AB' : 'transparent',
                color: selectedTab === 'timeline' ? '#ffffff' : '#adb5bd',
                border: 'none'
              }}
            >
              Timeline
            </button>
          </li>
          <li className="nav-item">
            <button 
              className={`nav-link ${selectedTab === 'participants' ? 'active' : ''}`}
              onClick={() => setSelectedTab('participants')}
              style={{ 
                backgroundColor: selectedTab === 'participants' ? '#3949AB' : 'transparent',
                color: selectedTab === 'participants' ? '#ffffff' : '#adb5bd',
                border: 'none'
              }}
            >
              Participants
            </button>
          </li>
        </ul>
        
        {/* Overview Tab */}
        {selectedTab === 'overview' && (
          <div>
            <div className="row mb-4">
              <div className="col-md-4 mb-4 mb-md-0">
                <div className="card h-100" style={{ backgroundColor: '#252536', borderColor: '#454564' }}>
                  <div className="card-header" style={{ borderColor: '#454564' }}>
                    <h5 className="card-title mb-0" style={{ color: '#e0e0e0' }}>Attention Overview</h5>
                  </div>
                  <div className="card-body d-flex flex-column justify-content-center align-items-center">
                    <div className="mb-4" style={{ height: '220px', width: '220px' }}>
                      {attentionDistributionData && (
                        <Pie 
                          data={attentionDistributionData} 
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                              legend: {
                                position: 'right',
                                labels: {
                                  color: '#e0e0e0',
                                  padding: 10,
                                  font: {
                                    size: 11
                                  }
                                }
                              },
                              tooltip: {
                                callbacks: {
                                  label: function(context) {
                                    const label = context.label || '';
                                    const value = context.raw || 0;
                                    const seconds = value;
                                    return `${label}: ${formatDuration(seconds)}`;
                                  }
                                }
                              }
                            }
                          }}
                        />
                      )}
                    </div>
                    
                    <div className="text-center">
                      <div className="h2 mb-0" style={{ color: '#e0e0e0' }}>
                        {Math.round(analytics.overview.averageAttention || 0)}%
                      </div>
                      <div className="text-muted">Average Attention</div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="col-md-8">
                <div className="card h-100" style={{ backgroundColor: '#252536', borderColor: '#454564' }}>
                  <div className="card-header" style={{ borderColor: '#454564' }}>
                    <h5 className="card-title mb-0" style={{ color: '#e0e0e0' }}>Attention States</h5>
                  </div>
                  <div className="card-body">
                    <div className="row">
                      {Object.entries(totalTimes).map(([state, seconds]) => (
                        <div className="col-md-6 mb-3" key={state}>
                          <div className="d-flex align-items-center">
                            <div className="me-3" style={{ width: '30px', textAlign: 'center' }}>
                              {getAttentionStateIcon(state)}
                            </div>
                            <div className="flex-grow-1">
                              <div className="d-flex justify-content-between mb-1">
                                <div style={{ color: '#e0e0e0' }}>{formatStateName(state)}</div>
                                <div className="text-muted">{formatDuration(seconds)}</div>
                              </div>
                              <div className="progress" style={{ height: '8px' }}>
                                <div 
                                  className="progress-bar" 
                                  style={{ 
                                    width: `${(seconds / Math.max(1, analytics.duration)) * 100}%`,
                                    backgroundColor: getAttentionStateColor(state)
                                  }}
                                  role="progressbar"
                                ></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="row">
              <div className="col-12">
                <div className="card" style={{ backgroundColor: '#252536', borderColor: '#454564' }}>
                  <div className="card-header" style={{ borderColor: '#454564' }}>
                    <h5 className="card-title mb-0" style={{ color: '#e0e0e0' }}>Attention by Participant</h5>
                  </div>
                  <div className="card-body">
                    <div style={{ height: '300px' }}>
                      {participantData && (
                        <Bar 
                          data={participantData} 
                          options={{
                            indexAxis: 'y',
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                              legend: {
                                display: false
                              },
                              tooltip: {
                                callbacks: {
                                  label: function(context) {
                                    return `Attention: ${context.raw.toFixed(1)}%`;
                                  }
                                }
                              }
                            },
                            scales: {
                              x: {
                                beginAtZero: true,
                                max: 100,
                                ticks: {
                                  color: '#adb5bd'
                                },
                                grid: {
                                  color: 'rgba(255, 255, 255, 0.05)'
                                }
                              },
                              y: {
                                ticks: {
                                  color: '#e0e0e0'
                                },
                                grid: {
                                  display: false
                                }
                              }
                            }
                          }}
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Timeline Tab */}
        {selectedTab === 'timeline' && (
          <div className="card" style={{ backgroundColor: '#252536', borderColor: '#454564' }}>
            <div className="card-header" style={{ borderColor: '#454564' }}>
              <h5 className="card-title mb-0" style={{ color: '#e0e0e0' }}>Attention Timeline</h5>
            </div>
            <div className="card-body">
              <div style={{ height: '400px' }}>
                {timeSeriesData ? (
                  <Line 
                    data={timeSeriesData} 
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      interaction: {
                        mode: 'nearest',
                        intersect: false
                      },
                      plugins: {
                        legend: {
                          position: 'top',
                          labels: {
                            color: '#e0e0e0',
                            padding: 10
                          }
                        },
                        tooltip: {
                          callbacks: {
                            label: function(context) {
                              return `${context.dataset.label}: ${context.raw.toFixed(1)}%`;
                            }
                          }
                        }
                      },
                      scales: {
                        x: {
                          ticks: {
                            color: '#adb5bd'
                          },
                          grid: {
                            color: 'rgba(255, 255, 255, 0.05)'
                          }
                        },
                        y: {
                          beginAtZero: true,
                          max: 100,
                          ticks: {
                            color: '#adb5bd'
                          },
                          grid: {
                            color: 'rgba(255, 255, 255, 0.05)'
                          }
                        }
                      }
                    }}
                  />
                ) : (
                  <div className="text-center py-5" style={{ color: '#adb5bd' }}>
                    <p>No timeline data available</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Participants Tab */}
        {selectedTab === 'participants' && (
          <div className="card" style={{ backgroundColor: '#252536', borderColor: '#454564' }}>
            <div className="card-header" style={{ borderColor: '#454564' }}>
              <h5 className="card-title mb-0" style={{ color: '#e0e0e0' }}>Participant Details</h5>
            </div>
            <div className="card-body">
              <h4 className="mt-5 mb-4">Participant Details</h4>
              
              <div className="table-responsive">
                <table className="table table-bordered table-hover">
                  <thead className="table-dark">
                    <tr>
                      <th>Name</th>
                      <th>Attention %</th>
                      <th>Total Time</th>
                      <th>Join Time</th>
                      <th>Leave Time</th>
                      <th>Attentive</th>
                      <th>Active</th>
                      <th>Looking Away</th>
                      <th>Drowsy</th>
                      <th>Absent</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.participantData.map((participant, index) => {
                      // Calculate participant total time from attentionData or use totalTime if available
                      const totalTime = participant.totalTime || 
                        Object.values(participant.attentionData || {}).reduce(
                          (sum, val) => sum + (typeof val === 'number' && !isNaN(val) ? Math.max(0, val) : 0), 
                          0
                        );
                      
                      return (
                        <tr key={index}>
                          <td>{participant.name}</td>
                          <td>{participant.attentionPercentage ? participant.attentionPercentage.toFixed(1) + '%' : '0%'}</td>
                          <td>{formatDuration(totalTime)}</td>
                          <td>{participant.joinTime ? formatTime(participant.joinTime) : 'N/A'}</td>
                          <td>{participant.leaveTime ? formatTime(participant.leaveTime) : 'Ongoing'}</td>
                          <td>{formatDuration(participant.attentionData?.attentive || 0)}</td>
                          <td>{formatDuration(participant.attentionData?.active || 0)}</td>
                          <td>{formatDuration(participant.attentionData?.looking_away || 0)}</td>
                          <td>{formatDuration(participant.attentionData?.drowsy || 0)}</td>
                          <td>{formatDuration(participant.attentionData?.absent || 0)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
      
      {/* Footer */}
      <footer className="py-3 text-center" style={{ backgroundColor: '#252536', borderTop: '1px solid #454564', color: '#adb5bd' }}>
        <div className="container">
          <p className="mb-0 small">
            Student Monitoring System - Meeting Analytics
          </p>
        </div>
      </footer>
    </div>
  );
};

export default MeetingAnalytics; 