import React, { useContext, useState, useMemo, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faEye, 
  faEyeSlash, 
  faUserSlash, 
  faBed, 
  faMoon,
  faUserCheck,
  faSort,
  faSortUp,
  faSortDown,
  faExclamationTriangle,
  faChartBar,
  faXmark,
  faMask
} from '@fortawesome/free-solid-svg-icons';
import { useAttention } from '../../context/AttentionContext';
import { SocketContext } from '../../context/SocketContext';
import AttentionSyncStatus from './AttentionSyncStatus';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import './HostAttentionPanel.css';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

const getAttentionColorClass = (state) => {
  switch (state) {
    case 'attentive':
      return 'bg-success';
    case 'active':
      return 'bg-primary';
    case 'looking_away':
      return 'bg-warning';
    case 'drowsy':
      return 'bg-warning text-dark';
    case 'sleeping':
      return 'bg-danger';
    case 'absent':
      return 'bg-danger';
    case 'darkness':
      return 'bg-secondary';
    default:
      return 'bg-secondary';
  }
};

const getAttentionLabel = (state) => {
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
      return 'Darkness';
    default:
      return 'Unknown';
  }
};

const formatTimeSince = (timestamp) => {
  if (!timestamp) return 'N/A';
  
  const timestampDate = new Date(timestamp);
  if (isNaN(timestampDate.getTime())) return 'Invalid time';
  
  const secondsAgo = Math.floor((Date.now() - timestampDate.getTime()) / 1000);
  
  if (secondsAgo < 0) return 'Just now';
  
  if (secondsAgo > 172800) {
    return 'Over 48h ago';
  }
  
  if (secondsAgo < 60) {
    return `${secondsAgo.toString().padStart(2, '0')}s ago`;
  } else if (secondsAgo < 3600) {
    const minutes = Math.floor(secondsAgo / 60);
    const seconds = secondsAgo % 60;
    return `${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s ago`;
  } else {
    const hours = Math.floor(secondsAgo / 3600);
    const minutes = Math.floor((secondsAgo % 3600) / 60);
    return `${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m ago`;
  }
};

const getAttentionStateName = (state) => {
  if (!state) return 'Unknown';
  
  switch(state) {
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

const getChartColor = (state) => {
  switch (state) {
    case 'attentive':
      return 'rgba(40, 167, 69, 0.9)';
    case 'active':
      return 'rgba(0, 123, 255, 0.9)';
    case 'looking_away':
      return 'rgba(255, 193, 7, 0.9)';
    case 'drowsy':
      return 'rgba(255, 180, 0, 0.9)';
    case 'sleeping':
      return 'rgba(220, 53, 69, 0.9)';
    case 'absent':
      return 'rgba(220, 53, 69, 0.9)';
    case 'darkness':
      return 'rgba(108, 117, 125, 0.9)';
    default:
      return 'rgba(108, 117, 125, 0.9)';
  }
};

const AttentionStatusIcon = ({ state }) => {
  switch (state) {
    case 'attentive':
      return <FontAwesomeIcon icon={faEye} className="text-success" title="Attentive" />;
    case 'looking_away':
      return <FontAwesomeIcon icon={faEyeSlash} className="text-warning" title="Looking Away" />;
    case 'absent':
      return <FontAwesomeIcon icon={faUserSlash} className="text-danger" title="Absent" />;
    case 'active':
      return <FontAwesomeIcon icon={faUserCheck} className="text-primary" title="Active" />;
    case 'drowsy':
      return <FontAwesomeIcon icon={faMoon} className="text-warning" title="Drowsy" />;
    case 'sleeping':
      return <FontAwesomeIcon icon={faBed} className="text-danger" title="Sleeping" />;
    case 'darkness':
      return <FontAwesomeIcon icon={faMask} className="text-secondary" title="Darkness" />;
    default:
      return <FontAwesomeIcon icon={faEyeSlash} className="text-secondary" title="Unknown" />;
  }
};

const HostAttentionPanel = ({ onClose }) => {
  const { attentionData, roomAttentionData, isMonitoringEnabled, isLoading, calculateSyncLevel } = useAttention();
  const { participants, socket, isRoomCreator } = useContext(SocketContext) || {};
  
  const [sortField, setSortField] = useState('attentionPercentage');
  const [sortDirection, setSortDirection] = useState('desc');
  const [attentionStats, setAttentionStats] = useState({
    attentive: 0,
    active: 0,
    lookingAway: 0,
    drowsy: 0,
    sleeping: 0,
    absent: 0,
    darkness: 0,
    distracted: 0,
    totalParticipants: 0,
    attentivePercentage: 0,
    byState: {}
  });
  const panelRef = useRef(null);
  
  const [attentionChanges, setAttentionChanges] = useState([]);
  const [timeUpdateTrigger, setTimeUpdateTrigger] = useState(Date.now());

  const previousStates = useRef({});
  
  const combinedData = {
    ...roomAttentionData?.attention,
    ...attentionData
  };
  
  const [lastUpdate, setLastUpdate] = useState(Date.now());
  const [autoRefresh, setAutoRefresh] = useState(true);
  const refreshTimerRef = useRef(null);
  
  useEffect(() => {
    const timeInterval = setInterval(() => {
      setTimeUpdateTrigger(Date.now());
    }, 1000);
    
    return () => clearInterval(timeInterval);
  }, []);
  
  useEffect(() => {
    if (autoRefresh) {
      refreshTimerRef.current = setInterval(() => {
        setLastUpdate(Date.now());
      }, 1000);
    } else if (refreshTimerRef.current) {
      clearInterval(refreshTimerRef.current);
    }
    
    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
    };
  }, [autoRefresh]);
  
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };
  
  const handleClose = () => {
    if (onClose) onClose();
  };
  
  const localUserId = socket?.id;
  
  const validParticipants = useMemo(() => {
    const result = [];
    
    if (localUserId && combinedData && combinedData[localUserId]) {
      result.push({
        id: localUserId,
        displayName: 'You (Host)'
      });
    }
    
    if (participants && Array.isArray(participants)) {
      participants.forEach(p => {
        if (p && p.id && p.id !== localUserId && combinedData && combinedData[p.id]) {
          result.push(p);
        }
      });
    }
    
    return result;
  }, [combinedData, localUserId, participants]);
  
  const formatStateDuration = (seconds) => {
    if (typeof seconds !== 'number' || isNaN(seconds) || seconds < 0) {
      return '00s';
    }
    
    if (seconds > 172800) {
      return 'Over 48h';
    }
    
    // Round to nearest second to avoid decimal display
    seconds = Math.round(seconds);
    
    if (seconds < 60) {
      return `${seconds.toString().padStart(2, '0')}s`;
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      
      if (remainingSeconds === 0) {
        return `${minutes.toString().padStart(2, '0')}m`;
      }
      return `${minutes.toString().padStart(2, '0')}m ${remainingSeconds.toString().padStart(2, '0')}s`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const remainingSeconds = seconds % 60;
      
      let result = `${hours.toString().padStart(2, '0')}h`;
      
      if (minutes > 0 || remainingSeconds > 0) {
        result += ` ${minutes.toString().padStart(2, '0')}m`;
      }
      
      if (remainingSeconds > 0) {
        result += ` ${remainingSeconds.toString().padStart(2, '0')}s`;
      }
      
      return result;
    }
  };
  
  const sortedParticipants = useMemo(() => {
    return [...validParticipants].sort((a, b) => {
      const dataA = combinedData[a.id] || {};
      const dataB = combinedData[b.id] || {};
      
      let valueA, valueB;
      
      switch (sortField) {
        case 'name':
          valueA = a.displayName || '';
          valueB = b.displayName || '';
          break;
        case 'attentionState':
          valueA = dataA.attentionState || '';
          valueB = dataB.attentionState || '';
          break;
        case 'stateSince':
          valueA = dataA.stateSince || 0;
          valueB = dataB.stateSince || 0;
          break;
        case 'attentionPercentage':
        default:
          valueA = dataA.attentionPercentage || 0;
          valueB = dataB.attentionPercentage || 0;
          break;
      }
      
      return sortDirection === 'asc' 
        ? (valueA > valueB ? 1 : -1)
        : (valueA < valueB ? 1 : -1);
    });
  }, [validParticipants, combinedData, sortField, sortDirection, timeUpdateTrigger]);
  
  useEffect(() => {
    const attentiveCount = Object.values(combinedData || {}).filter(
      data => data?.attentionState === 'attentive'
    ).length;
    
    const activeCount = Object.values(combinedData || {}).filter(
      data => data?.attentionState === 'active'
    ).length;
    
    const lookingAwayCount = Object.values(combinedData || {}).filter(
      data => data?.attentionState === 'looking_away'
    ).length;
    
    const drowsyCount = Object.values(combinedData || {}).filter(
      data => data?.attentionState === 'drowsy'
    ).length;
    
    const sleepingCount = Object.values(combinedData || {}).filter(
      data => data?.attentionState === 'sleeping'
    ).length;
    
    const absentCount = Object.values(combinedData || {}).filter(
      data => data?.attentionState === 'absent'
    ).length;
    
    const darknessCount = Object.values(combinedData || {}).filter(
      data => data?.attentionState === 'darkness'
    ).length;
    
    const distractedCount = lookingAwayCount + drowsyCount;
    const totalParticipants = validParticipants.length;
    const attentivePercentage = totalParticipants > 0 ? ((attentiveCount + activeCount) / totalParticipants) * 100 : 0;

    const stateCount = Object.values(combinedData || {}).reduce((acc, data) => {
      const state = data?.attentionState;
      if (state) {
        acc[state] = (acc[state] || 0) + 1;
      }
      return acc;
    }, {});
    
    setAttentionStats({
      attentive: attentiveCount,
      active: activeCount,
      lookingAway: lookingAwayCount,
      drowsy: drowsyCount,
      sleeping: sleepingCount,
      absent: absentCount,
      darkness: darknessCount,
      distracted: distractedCount,
      totalParticipants,
      attentivePercentage,
      byState: stateCount
    });
  }, [combinedData, validParticipants]);
  
  const calculateAttentionMetrics = () => {
    const totalCount = validParticipants.length;
    if (totalCount === 0) return { avg: 0, engaged: 0, disengaged: 0 };
    
    let totalPercentage = 0;
    let engagedCount = 0;
    let disengagedCount = 0;
    
    validParticipants.forEach(p => {
      const data = combinedData[p.id];
      if (data) {
        totalPercentage += data.attentionPercentage || 0;
        
        if (data.attentionPercentage > 70) {
          engagedCount++;
        } else if (data.attentionPercentage < 30) {
          disengagedCount++;
        }
      }
    });
    
    return {
      avg: totalCount > 0 ? totalPercentage / totalCount : 0,
      engaged: engagedCount,
      disengaged: disengagedCount
    };
  };

  const metrics = calculateAttentionMetrics();
  
  useEffect(() => {
    const newChanges = [];
    
    validParticipants.forEach(participant => {
      const data = combinedData[participant.id];
      if (!data) return;
      
      const prevState = previousStates.current[participant.id];
      const currentState = data.attentionState;
      
      if (prevState && prevState !== currentState) {
        newChanges.push({
          id: `${participant.id}-${Date.now()}`,
          userId: participant.id,
          userName: participant.displayName,
          fromState: prevState,
          toState: currentState,
          timestamp: Date.now()
        });
      }
      
      previousStates.current[participant.id] = currentState;
    });
    
    if (newChanges.length > 0) {
      setAttentionChanges(prev => {
        const combined = [...newChanges, ...prev];
        return combined.slice(0, 20);
      });
    }
  }, [combinedData, validParticipants]);
  
  // Function to calculate state duration in seconds from stateSince timestamp
  const calculateStateDuration = (stateSince) => {
    if (!stateSince) return 0;
    
    try {
      // Support both millisecond timestamps (numbers) and date strings
      let timestampMs;
      
      if (typeof stateSince === 'number') {
        // Already a timestamp in milliseconds
        timestampMs = stateSince;
      } else {
        // Parse as date string
        const date = new Date(stateSince);
        if (isNaN(date.getTime())) {
          console.error('Invalid date in calculateStateDuration:', stateSince);
          return 0;
        }
        timestampMs = date.getTime();
      }
      
      const nowMs = Date.now();
      const diffSeconds = (nowMs - timestampMs) / 1000;
      
      // Sanity check - don't allow negative durations or durations over 48 hours
      if (diffSeconds < 0) return 0;
      if (diffSeconds > 172800) return 172800; // Cap at 48 hours
      
      return diffSeconds;
    } catch (error) {
      console.error('Error calculating state duration:', error);
      return 0;
    }
  };
  
  if (!isMonitoringEnabled || !isRoomCreator) return null;
  
  const pieChartData = {
    labels: [
      'Attentive', 
      'Active', 
      'Looking Away', 
      'Drowsy', 
      'Sleeping', 
      'Absent', 
      'Darkness'
    ],
    datasets: [
      {
        data: [
          attentionStats.attentive,
          attentionStats.active,
          attentionStats.lookingAway,
          attentionStats.drowsy,
          attentionStats.sleeping,
          attentionStats.absent,
          attentionStats.darkness
        ],
        backgroundColor: [
          getChartColor('attentive'),
          getChartColor('active'),
          getChartColor('looking_away'),
          getChartColor('drowsy'),
          getChartColor('sleeping'),
          getChartColor('absent'),
          getChartColor('darkness')
        ],
        borderColor: [
          'rgba(40, 167, 69, 1)',   
          'rgba(0, 123, 255, 1)',   
          'rgba(255, 193, 7, 1)',   
          'rgba(255, 180, 0, 1)',   
          'rgba(220, 53, 69, 1)',   
          'rgba(220, 53, 69, 1)',   
          'rgba(108, 117, 125, 1)', 
        ],
        borderWidth: 1,
      },
    ],
  };
  
  const detailedChartData = {
    labels: Object.keys(attentionStats.byState).map(state => getAttentionStateName(state)),
    datasets: [
      {
        label: 'Participants',
        data: Object.values(attentionStats.byState),
        backgroundColor: Object.keys(attentionStats.byState).map(state => getChartColor(state)),
        borderColor: 'rgba(255, 255, 255, 0.8)',
        borderWidth: 1,
      },
    ],
  };
  
  const barChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#e0e0e0'
        }
      },
      title: {
        display: true,
        text: 'Detailed Attention States',
        color: '#ffffff'
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0,
          color: '#e0e0e0'
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        }
      },
      x: {
        ticks: {
          color: '#e0e0e0'
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        }
      }
    }
  };
  
  const syncInfo = calculateSyncLevel();
  
  if (attentionStats.totalParticipants === 0) {
    return (
      <div className="host-attention-panel-container">
        <div className="host-attention-panel card" ref={panelRef}>
          <div className="card-header bg-dark text-white">
            <div className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                <FontAwesomeIcon icon={faChartBar} className="me-2" />
                Host Attention Dashboard
              </h5>
              <div className="panel-controls">
                <button className="text-white p-0" onClick={handleClose}>
                  <FontAwesomeIcon icon={faXmark} />
                </button>
              </div>
            </div>
          </div>
          <div className="card-body text-center py-5 bg-dark text-light">
            <p className="text-light mb-3">No participant data available yet.</p>
            <p className="text-muted">Waiting for participants to join...</p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="host-attention-panel-container">
      <div className="host-attention-panel card" ref={panelRef}>
        <div className="card-header bg-dark text-white">
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0">
              <FontAwesomeIcon icon={faChartBar} className="me-2" />
              Host Attention Dashboard
            </h5>
            <div className="d-flex align-items-center">
              <div className="me-3 d-flex align-items-center">
                <div className="form-check form-switch">
                  <input 
                    className="form-check-input" 
                    type="checkbox" 
                    id="auto-refresh-toggle"
                    checked={autoRefresh}
                    onChange={() => setAutoRefresh(prev => !prev)}
                  />
                  <label className="form-check-label text-white small" htmlFor="auto-refresh-toggle">
                    Auto-refresh
                  </label>
                </div>
                <small className="ms-2 text-white-50">
                  {autoRefresh ? 'On' : 'Off'} (Last update: {new Date(lastUpdate).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit', second: '2-digit'})})
                </small>
              </div>
              <span className="badge bg-light text-dark me-2">
                {attentionStats.totalParticipants} Participants
              </span>
              <div className="panel-controls">
                <button className="text-white p-0" onClick={handleClose}>
                  <FontAwesomeIcon icon={faXmark} />
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="card-body panel-content">
          <div className="row mb-4">
            <div className="col-md-12">
              <div className="card">
                <div className="card-header">
                  <h5 className="mb-0">Realtime Attention Overview</h5>
                </div>
                <div className="card-body">
                  <div className="row">
                    <div className="col-md-4 border-end">
                      <div className="text-center">
                        <h6 className="text-muted mb-1">Average Attention</h6>
                        <div className="d-flex align-items-center justify-content-center">
                          <div className="display-4 fw-bold">{Math.round(metrics.avg)}%</div>
                          <div className="ms-2 progress-circle" style={{ width: '80px', height: '80px' }}>
                            <svg viewBox="0 0 36 36" className="circular-chart">
                              <path className="circle-bg"
                                d="M18 2.0845
                                  a 15.9155 15.9155 0 0 1 0 31.831
                                  a 15.9155 15.9155 0 0 1 0 -31.831"
                                style={{ fill: 'none', stroke: '#eee', strokeWidth: '2.8' }}
                              />
                              <path className="circle"
                                strokeDasharray={`${Math.round(metrics.avg)}, 100`}
                                d="M18 2.0845
                                  a 15.9155 15.9155 0 0 1 0 31.831
                                  a 15.9155 15.9155 0 0 1 0 -31.831"
                                style={{ 
                                  fill: 'none', 
                                  stroke: metrics.avg > 70 ? '#28a745' : metrics.avg > 30 ? '#ffc107' : '#dc3545', 
                                  strokeWidth: '2.8',
                                  strokeLinecap: 'round'
                                }}
                              />
                            </svg>
                          </div>
                </div>
              </div>
            </div>
                    <div className="col-md-4 border-end">
                      <div className="text-center">
                        <h6 className="text-muted mb-3">Current State Distribution</h6>
                        <div className="d-flex justify-content-around">
                          <div className="text-center">
                            <div className="h4 mb-0 text-success">{attentionStats.attentive + attentionStats.active}</div>
                            <small className="text-muted">Engaged</small>
                          </div>
                          <div className="text-center">
                            <div className="h4 mb-0 text-warning">{attentionStats.lookingAway + attentionStats.drowsy}</div>
                            <small className="text-muted">Distracted</small>
                          </div>
                          <div className="text-center">
                            <div className="h4 mb-0 text-danger">{attentionStats.absent + attentionStats.sleeping}</div>
                            <small className="text-muted">Absent</small>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-4">
                      <div className="text-center">
                        <h6 className="text-muted mb-3">Engagement Level</h6>
                        <div className="d-flex align-items-center justify-content-center">
                          <div className="engagement-meter position-relative" style={{ width: '120px', height: '60px' }}>
                            <div className="engagement-gauge" style={{ 
                              width: '120px', 
                              height: '60px', 
                              borderRadius: '60px 60px 0 0', 
                              background: 'linear-gradient(to right, #dc3545, #ffc107, #28a745)',
                              position: 'relative',
                              overflow: 'hidden'
                            }}>
                            </div>
                            <div className="engagement-needle" style={{
                              position: 'absolute',
                              bottom: '0',
                              left: '60px',
                              width: '2px',
                              height: '55px',
                              background: '#000',
                              transformOrigin: 'bottom center',
                              transform: `rotate(${(metrics.avg / 100 * 180) - 90}deg)`,
                              transition: 'transform 1s ease-in-out'
                            }}></div>
                            <div className="engagement-center" style={{
                              position: 'absolute',
                              bottom: '0',
                              left: '60px',
                              width: '6px',
                              height: '6px',
                              background: '#000',
                              borderRadius: '50%',
                              transform: 'translateX(-50%)'
                            }}></div>
                          </div>
                        </div>
                        <div className="text-center mt-2">
                          <span className={`badge ${
                            metrics.avg > 70 ? 'bg-success' : 
                            metrics.avg > 30 ? 'bg-warning' : 
                            'bg-danger'
                          }`}>
                            {
                              metrics.avg > 70 ? 'High Engagement' : 
                              metrics.avg > 30 ? 'Moderate Engagement' : 
                              'Low Engagement'
                            }
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="row mb-4">
            <div className="col-md-6 mb-3 mb-md-0">
              <div className="card chart-card">
                <div className="card-header">
                  Attention Overview
                </div>
                <div className="card-body">
                  <div className="chart-container">
                    <Pie data={pieChartData} options={{ 
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'right',
                          labels: {
                            color: '#e0e0e0',
                            padding: 15,
                            font: {
                              size: 12
                            }
                          }
                        },
                        tooltip: {
                          backgroundColor: 'rgba(0, 0, 0, 0.8)',
                          titleColor: '#ffffff',
                          bodyColor: '#ffffff',
                          borderColor: 'rgba(255, 255, 255, 0.1)',
                          borderWidth: 1
                        }
                      }
                    }} />
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <div className="card chart-card">
                <div className="card-header">
                  Detailed Attention States
                </div>
                <div className="card-body">
                  <div className="chart-container">
                    <Bar data={detailedChartData} options={{ ...barChartOptions, maintainAspectRatio: false }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <AttentionSyncStatus />
          
          <div className="table-container">
          <div className="table-responsive">
              <table className="table table-hover" style={{ backgroundColor: '#252536' }}>
                <thead style={{ backgroundColor: '#2a2a42' }}>
                  <tr style={{ backgroundColor: '#2a2a42' }}>
                  <th onClick={() => handleSort('name')} style={{ cursor: 'pointer' }}>
                    Participant
                    {sortField === 'name' && (
                      <FontAwesomeIcon 
                        icon={sortDirection === 'asc' ? faSortUp : faSortDown} 
                        className="ms-1"
                      />
                    )}
                  </th>
                  <th onClick={() => handleSort('attentionState')} style={{ cursor: 'pointer' }}>
                    State
                    {sortField === 'attentionState' && (
                      <FontAwesomeIcon 
                        icon={sortDirection === 'asc' ? faSortUp : faSortDown} 
                        className="ms-1"
                      />
                    )}
                  </th>
                  <th onClick={() => handleSort('stateSince')} style={{ cursor: 'pointer' }}>
                    Since
                    {sortField === 'stateSince' && (
                      <FontAwesomeIcon 
                        icon={sortDirection === 'asc' ? faSortUp : faSortDown} 
                        className="ms-1"
                      />
                    )}
                  </th>
                  <th onClick={() => handleSort('attentionPercentage')} style={{ cursor: 'pointer' }}>
                    Attention %
                    {sortField === 'attentionPercentage' && (
                      <FontAwesomeIcon 
                        icon={sortDirection === 'asc' ? faSortUp : faSortDown} 
                        className="ms-1"
                      />
                    )}
                  </th>
                  <th>Confidence</th>
                    <th>Duration</th>
                </tr>
              </thead>
              <tbody>
                {sortedParticipants.map(participant => {
                  const data = combinedData[participant.id];
                  
                  if (!data) return null;
                  
                  const displayName = participant.displayName;
                  
                  // Calculate state duration using our helper function
                  const stateDuration = calculateStateDuration(data.stateSince);
                  
                  return (
                      <tr key={participant.id} style={{ backgroundColor: '#252536' }}>
                      <td>
                        <div className="d-flex align-items-center">
                            <div className="avatar me-2 rounded-circle d-flex align-items-center justify-content-center" style={{ width: 32, height: 32, backgroundColor: '#323248', color: '#e0e0e0' }}>
                            <span className="avatar-text">{displayName?.charAt(0)?.toUpperCase() || '?'}</span>
                          </div>
                          <span className="participant-name">{displayName}</span>
                        </div>
                      </td>
                      <td className="text-center">
                          <div className="d-flex align-items-center">
                            <AttentionStatusIcon state={data.attentionState} />
                            <span className={`badge ms-2 ${getAttentionColorClass(data.attentionState)}`} style={{ color: '#000' }}>
                          {getAttentionStateName(data.attentionState)}
                        </span>
                          </div>
                      </td>
                      <td>
                        {formatTimeSince(data.stateSince)}
                      </td>
                      <td>
                        <div className="d-flex align-items-center">
                          <div className="progress flex-grow-1 me-2" style={{ height: 8 }}>
                            <div 
                              className={`progress-bar ${getAttentionColorClass(data.attentionState)}`}
                              role="progressbar" 
                              style={{ width: `${Math.round(data.attentionPercentage || 0)}%` }}
                              aria-valuenow={Math.round(data.attentionPercentage || 0)} 
                              aria-valuemin="0" 
                              aria-valuemax="100"
                            ></div>
                          </div>
                            <span className="percentage-text small text-light">{Math.round(data.attentionPercentage || 0)}%</span>
                        </div>
                      </td>
                      <td className="text-center">
                          <div className="progress" style={{ height: 8 }}>
                            <div 
                              className={`progress-bar ${data.confidence > 70 ? 'bg-success' : data.confidence > 40 ? 'bg-warning' : 'bg-danger'}`}
                              role="progressbar" 
                              style={{ width: `${Math.round(data.confidence || 0)}%` }}
                              aria-valuenow={Math.round(data.confidence || 0)}
                              aria-valuemin="0" 
                              aria-valuemax="100"
                            ></div>
                          </div>
                          <span className="small mt-1 d-inline-block text-light">{Math.round(data.confidence || 0)}%</span>
                        </td>
                        <td className="text-center">
                          <span className="badge duration-badge" style={{ backgroundColor: '#323248', color: '#e0e0e0' }}>
                            {formatStateDuration(stateDuration)}
                          </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
          </div>

          <div className="card mt-4 mb-4">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Live Attention Feed</h5>
              <span className="badge bg-primary">Real-time</span>
            </div>
            <div className="card-body p-0">
              <div className="list-group list-group-flush" style={{maxHeight: '200px', overflowY: 'auto'}}>
                {sortedParticipants.map(participant => {
                  const data = combinedData[participant.id];
                  if (!data) return null;
                  
                  // Calculate state duration using our helper function
                  const feedStateDuration = calculateStateDuration(data.stateSince);
                  
                  return (
                    <div 
                      key={participant.id} 
                      className="list-group-item d-flex justify-content-between align-items-center py-2"
                    >
                      <div className="d-flex align-items-center">
                        <AttentionStatusIcon state={data.attentionState} />
                        <span className="ms-2">{participant.displayName}</span>
                      </div>
                      <div className="d-flex align-items-center">
                        <span className={`badge ${getAttentionColorClass(data.attentionState)}`} style={{ color: '#000' }}>
                          {getAttentionStateName(data.attentionState)}
                        </span>
                        <span className="badge duration-badge ms-2" style={{ backgroundColor: '#323248', color: '#e0e0e0' }}>
                          {formatStateDuration(feedStateDuration)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="card mt-4">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Attention State Changes</h5>
              <span className="badge bg-secondary">{attentionChanges.length} recent changes</span>
            </div>
            <div className="card-body p-0">
              {attentionChanges.length === 0 ? (
                <div className="text-center py-4 text-muted">
                  No attention state changes recorded yet
                </div>
              ) : (
                <div className="list-group list-group-flush" style={{maxHeight: '200px', overflowY: 'auto'}}>
                  {attentionChanges.map(change => (
                    <div 
                      key={change.id} 
                      className="list-group-item py-2"
                    >
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <strong>{change.userName}</strong> changed from{' '}
                          <span className={`badge ${getAttentionColorClass(change.fromState)}`} style={{ color: '#000' }}>
                            {getAttentionStateName(change.fromState)}
                          </span>
                          {' '}to{' '}
                          <span className={`badge ${getAttentionColorClass(change.toState)}`} style={{ color: '#000' }}>
                            {getAttentionStateName(change.toState)}
                          </span>
                        </div>
                        <small className="text-muted">
                          {new Date(change.timestamp).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit', second: '2-digit'})}
                        </small>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HostAttentionPanel;
