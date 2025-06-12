import React, { useState, useEffect, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faEye, 
  faEyeSlash, 
  faUserSlash, 
  faBed, 
  faMoon,
  faUserCheck,
  faMask,
  faXmark,
  faExclamationTriangle,
  faBell,
  faBellSlash,
  faVolumeMute,
  faVolumeUp,
  faHistory,
  faCheck,
  faFilter
} from '@fortawesome/free-solid-svg-icons';
import soundManager, { isSoundEnabled, setSoundEnabled, playSound } from '../../utils/soundManager';

// Custom styling for the alerts component
const styles = {
  alertContainer: {
    position: 'fixed',
    top: '80px',
    right: '20px',
    width: '330px',
    maxWidth: '100%',
    zIndex: 1050,
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  alert: {
    padding: '12px 15px',
    borderRadius: '8px',
    boxShadow: '0 4px 10px rgba(0, 0, 0, 0.15)',
    backgroundColor: '#fff',
    border: '1px solid #dee2e6',
    display: 'flex',
    flexDirection: 'column',
    animation: 'slideIn 0.3s ease'
  },
  alertHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px'
  },
  alertTitle: {
    fontWeight: 'bold',
    fontSize: '14px',
    margin: 0,
    display: 'flex',
    alignItems: 'center'
  },
  alertContent: {
    fontSize: '13px'
  },
  alertActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: '8px',
    gap: '5px'
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '0',
    color: '#6c757d',
    fontSize: '16px'
  },
  stateIcon: {
    marginRight: '8px'
  },
  badge: {
    fontSize: '10px',
    padding: '3px 6px',
    borderRadius: '12px',
    marginLeft: '5px'
  },
  timeStamp: {
    fontSize: '10px',
    color: '#6c757d',
    marginTop: '4px'
  },
  toolbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
    backgroundColor: '#f8f9fa',
    padding: '6px 12px',
    borderRadius: '6px',
    color: 'black',
    border: '1px solid #dee2e6'
  },
  toolbarButtons: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center'
  },
  filterDropdown: {
    position: 'absolute',
    top: '30px',
    right: '0',
    backgroundColor: 'white',
    border: '1px solid #dee2e6',
    borderRadius: '4px',
    padding: '8px',
    width: '160px',
    boxShadow: '0 4px 10px rgba(0, 0, 0, 0.15)',
    zIndex: 1051
  },
  filterOption: {
    display: 'flex',
    alignItems: 'center',
    padding: '4px 8px',
    cursor: 'pointer',
    borderRadius: '4px',
    fontSize: '13px'
  },
  historyPanel: {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '20px',
    width: '90%',
    maxWidth: '500px',
    maxHeight: '80vh',
    overflow: 'auto',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)',
    zIndex: 1060
  },
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1055
  },
  emptyState: {
    textAlign: 'center',
    padding: '20px',
    color: '#495057',
    fontStyle: 'italic'
  }
};

// Icons for different attention states
const getStateIcon = (state) => {
  try {
    switch (state) {
      case 'attentive':
        return <FontAwesomeIcon icon={faEye} className="text-success" style={{ color: '#28a745' }} />;
      case 'active':
        return <FontAwesomeIcon icon={faUserCheck} className="text-primary" style={{ color: '#3949AB' }} />;
      case 'looking_away':
        return <FontAwesomeIcon icon={faEyeSlash} className="text-warning" style={{ color: '#ffc107' }} />;
      case 'drowsy':
        return <FontAwesomeIcon icon={faMoon} className="text-warning" style={{ color: '#ffc107' }} />;
      case 'sleeping':
        return <FontAwesomeIcon icon={faBed} className="text-danger" style={{ color: '#dc3545' }} />;
      case 'absent':
        return <FontAwesomeIcon icon={faUserSlash} className="text-danger" style={{ color: '#dc3545' }} />;
      case 'darkness':
        return <FontAwesomeIcon icon={faMask} className="text-secondary" style={{ color: '#6c757d' }} />;
      default:
        return <FontAwesomeIcon icon={faExclamationTriangle} className="text-secondary" style={{ color: '#6c757d' }} />;
    }
  } catch (error) {
    console.error('Error in getStateIcon:', error);
    return <FontAwesomeIcon icon={faExclamationTriangle} className="text-secondary" style={{ color: '#6c757d' }} />;
  }
};

// Background colors for different alert types
const getAlertTypeStyle = (type) => {
  try {
    switch (type) {
      case 'warning':
        return { 
          borderLeft: '4px solid #ffc107', 
          backgroundColor: '#fff8e1',
          color: 'black'
        };
      case 'danger':
        return { 
          borderLeft: '4px solid #dc3545', 
          backgroundColor: '#f8d7da',
          color: 'black'
        };
      case 'success':
        return { 
          borderLeft: '4px solid #28a745', 
          backgroundColor: '#d4edda',
          color: 'black'
        };
      case 'info':
      default:
        return { 
          borderLeft: '4px solid #17a2b8', 
          backgroundColor: '#e3f2fd',
          color: 'black'
        };
    }
  } catch (error) {
    console.error('Error in getAlertTypeStyle:', error);
    return { 
      borderLeft: '4px solid #17a2b8', 
      backgroundColor: '#e3f2fd',
      color: 'black'
    };
  }
};

const formatTime = (timestamp) => {
  try {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch (error) {
    console.error('Error formatting time:', error);
    return 'Unknown time';
  }
};

const formatDate = (timestamp) => {
  try {
    const date = new Date(timestamp);
    return date.toLocaleDateString([], { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Unknown date';
  }
};

const ParticipantStateAlert = ({ 
  alerts = [], 
  allAlerts = [],
  onDismiss,
  onDismissAll,
  alertsEnabled = true,
  onToggleAlerts,
  maxAlerts = 5
}) => {
  const [isEnabled, setIsEnabled] = useState(alertsEnabled);
  const [soundEnabled, setSoundEnabledState] = useState(isSoundEnabled);
  const [showHistory, setShowHistory] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [filterType, setFilterType] = useState('all');
  
  const previousAlertsCount = React.useRef(alerts.length);
  
  // Initialize sound manager if needed
  useEffect(() => {
    // Sound manager is auto-initialized on import
    return () => {
      // Clean up any resources when component unmounts
      soundManager.cleanupSounds();
    };
  }, []);
  
  // Play sound notification when new alerts arrive
  useEffect(() => {
    try {
      if (soundEnabled && alerts.length > previousAlertsCount.current && alerts.length > 0) {
        // Get the most recent alert
        const latestAlert = alerts[0];
        const alertType = latestAlert.alertType || 'info';
        
        // Use the sound manager to play the appropriate sound
        // Critical alerts (danger) should be louder/more noticeable
        if (alertType === 'danger') {
          // Play the sound twice for critical alerts with a small delay between
          playSound(alertType).then(() => {
            setTimeout(() => {
              playSound(alertType).catch(err => console.error('Error playing second alert sound:', err));
            }, 300);
          }).catch(err => {
            console.error('Error playing critical notification sound:', err);
          });
        } else {
          // Regular sound for non-critical alerts
          playSound(alertType).catch(err => {
            console.error('Error playing notification sound:', err);
          });
        }
      }
      
      previousAlertsCount.current = alerts.length;
    } catch (error) {
      console.error('Error in sound notification:', error);
    }
  }, [alerts, soundEnabled]);
  
  // Auto-dismiss old alerts after 15 seconds
  useEffect(() => {
    try {
      const timers = alerts.map(alert => {
        return setTimeout(() => {
          if (onDismiss) onDismiss(alert.id);
        }, 15000);
      });
      
      return () => {
        timers.forEach(timer => clearTimeout(timer));
      };
    } catch (error) {
      console.error('Error setting up auto-dismiss timers:', error);
    }
  }, [alerts, onDismiss]);
  
  // Toggle alert sounds
  const handleToggleSound = useCallback(() => {
    const newState = !soundEnabled;
    setSoundEnabledState(newState);
    setSoundEnabled(newState);
  }, [soundEnabled]);
  
  // Toggle alerts visibility
  const handleToggleAlerts = useCallback(() => {
    const newState = !isEnabled;
    setIsEnabled(newState);
    if (onToggleAlerts) {
      onToggleAlerts(newState);
    }
  }, [isEnabled, onToggleAlerts]);
  
  // Toggle history panel
  const handleToggleHistory = useCallback(() => {
    setShowHistory(prev => !prev);
  }, []);
  
  // Filter alerts by type
  const filteredAlerts = useCallback((alertsList) => {
    try {
      if (filterType === 'all') return alertsList;
      return alertsList.filter(alert => alert.alertType === filterType);
    } catch (error) {
      console.error('Error filtering alerts:', error);
      return alertsList;
    }
  }, [filterType]);
  
  // The alerts to display based on current filters
  const visibleAlerts = isEnabled ? filteredAlerts(alerts).slice(0, maxAlerts) : [];
  
  // If no alerts and alerts are disabled, show a simple toggle button
  if (visibleAlerts.length === 0 && !isEnabled && !showHistory) {
    return (
      <div style={styles.alertContainer}>
        <button 
          className="btn btn-sm btn-outline-primary"
          onClick={handleToggleAlerts}
          style={{ alignSelf: 'flex-end', color: '#3949AB', borderColor: '#3949AB' }}
        >
          <FontAwesomeIcon icon={faBell} className="me-1" />
          Enable Alerts
        </button>
      </div>
    );
  }
  
  return (
    <>
      <div style={styles.alertContainer}>
        <div style={styles.toolbar}>
          <h6 className="mb-0 small">Participant Alerts</h6>
          <div style={styles.toolbarButtons}>
            {alerts.length > 0 && (
              <button 
                className="btn btn-sm btn-link p-0 text-dark" 
                onClick={onDismissAll}
                title="Clear all alerts"
              >
                <FontAwesomeIcon icon={faCheck} />
              </button>
            )}
            
            <button 
              className="btn btn-sm btn-link p-0 text-dark" 
              onClick={handleToggleSound}
              title={soundEnabled ? "Mute alerts" : "Enable alert sounds"}
            >
              <FontAwesomeIcon icon={soundEnabled ? faVolumeUp : faVolumeMute} />
            </button>
            
            <div className="position-relative">
              <button 
                className="btn btn-sm btn-link p-0 text-dark" 
                onClick={() => setShowFilterMenu(!showFilterMenu)}
                title="Filter alerts"
              >
                <FontAwesomeIcon icon={faFilter} />
              </button>
              
              {showFilterMenu && (
                <div style={styles.filterDropdown} onClick={() => setShowFilterMenu(false)}>
                  <div
                    style={{
                      ...styles.filterOption,
                      color: 'black',
                      backgroundColor: filterType === 'all' ? '#f0f0f0' : 'transparent'
                    }}
                    onClick={() => setFilterType('all')}
                  >
                    <span style={{ color: 'black', marginRight: '8px' }}>All</span>
                  </div>
                  <div
                    style={{
                      ...styles.filterOption,
                      color: 'black',
                      backgroundColor: filterType === 'success' ? '#f0f0f0' : 'transparent'
                    }}
                    onClick={() => setFilterType('success')}
                  >
                    <span className="text-success me-2" style={{ color: 'black' }}>
                      <FontAwesomeIcon style={{ color: 'black' }} icon={faUserCheck} />
                    </span>
                    Active
                  </div>
                  <div
                    style={{
                      ...styles.filterOption,
                      color: 'black',
                      backgroundColor: filterType === 'info' ? '#f0f0f0' : 'transparent'
                    }}
                    onClick={() => setFilterType('info')}
                  >
                    <span className="text-info me-2" style={{ color: 'black' }}>
                      <FontAwesomeIcon style={{ color: 'black' }} icon={faEyeSlash} />
                    </span>
                    Looking Away
                  </div>
                  <div
                    style={{
                      ...styles.filterOption,
                      color: 'black',
                      backgroundColor: filterType === 'warning' ? '#f0f0f0' : 'transparent'
                    }}
                    onClick={() => setFilterType('warning')}
                  >
                    <span className="text-warning me-2" style={{ color: 'black' }}>
                      <FontAwesomeIcon style={{ color: 'black' }} icon={faMoon} />
                    </span>
                    Drowsy
                  </div>
                  <div
                    style={{
                      ...styles.filterOption,
                      color: 'black',
                      backgroundColor: filterType === 'danger' ? '#f0f0f0' : 'transparent'
                    }}
                    onClick={() => setFilterType('danger')}
                  >
                    <span className="text-danger me-2" style={{ color: 'black' }}>
                      <FontAwesomeIcon style={{ color: 'black' }} icon={faUserSlash} />
                    </span>
                    Absent
                  </div>
                </div>
              )}
            </div>
            
            <button 
              className="btn btn-sm btn-link p-0 text-dark" 
              onClick={handleToggleHistory}
              title="View alert history"
            >
              <FontAwesomeIcon icon={faHistory} />
            </button>
            
            <button 
              className="btn btn-sm btn-link p-0 text-dark" 
              onClick={handleToggleAlerts}
              title={isEnabled ? "Disable alerts" : "Enable alerts"}
            >
              <FontAwesomeIcon icon={isEnabled ? faBellSlash : faBell} />
            </button>
          </div>
        </div>
        
        {visibleAlerts.length === 0 && isEnabled ? (
          <div style={styles.emptyState}>
            No new alerts
          </div>
        ) : (
          <>
            {visibleAlerts.map(alert => (
              <div 
                key={alert.id} 
                style={{...styles.alert, ...getAlertTypeStyle(alert.alertType)}}
                className="alert-animation"
              >
                <div style={styles.alertHeader}>
                  <div style={styles.alertTitle}>
                    <span style={styles.stateIcon}>{getStateIcon(alert.newState)}</span>
                    {alert.participantName}
                  </div>
                  <button 
                    style={styles.closeBtn} 
                    onClick={() => onDismiss(alert.id)}
                    aria-label="Close alert"
                  >
                    <FontAwesomeIcon icon={faXmark} />
                  </button>
                </div>
                <div style={styles.alertContent}>
                  {alert.message}
                  <div style={styles.timeStamp}>{formatTime(alert.timestamp)}</div>
                </div>
              </div>
            ))}
            
            {alerts.length > maxAlerts && isEnabled && (
              <div className="text-center small text-muted mt-1">
                +{alerts.length - maxAlerts} more alerts
              </div>
            )}
          </>
        )}
      </div>
      
      {/* Alert History Panel */}
      {showHistory && (
        <>
          <div style={styles.overlay} onClick={handleToggleHistory}></div>
          <div style={styles.historyPanel}>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="mb-0">Alert History</h5>
              <button 
                className="btn-close" 
                onClick={handleToggleHistory}
                aria-label="Close history"
              ></button>
            </div>
            
            {allAlerts.length === 0 ? (
              <div style={styles.emptyState}>
                No alert history
              </div>
            ) : (
              <div className="alert-history-list">
                {filteredAlerts(allAlerts).map(alert => (
                  <div 
                    key={alert.id} 
                    style={{
                      ...styles.alert,
                      ...getAlertTypeStyle(alert.alertType),
                      opacity: alert.read ? 0.7 : 1,
                      marginBottom: '8px'
                    }}
                  >
                    <div style={styles.alertHeader}>
                      <div style={styles.alertTitle}>
                        <span style={styles.stateIcon}>{getStateIcon(alert.newState)}</span>
                        {alert.participantName}
                      </div>
                      {!alert.read && (
                        <button 
                          style={styles.closeBtn} 
                          onClick={() => onDismiss(alert.id)}
                          aria-label="Mark as read"
                        >
                          <FontAwesomeIcon icon={faCheck} />
                        </button>
                      )}
                    </div>
                    <div style={styles.alertContent}>
                      {alert.message}
                      <div style={styles.timeStamp}>
                        {formatDate(alert.timestamp)} at {formatTime(alert.timestamp)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
};

export default React.memo(ParticipantStateAlert); 