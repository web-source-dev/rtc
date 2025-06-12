import React, { useEffect, useContext } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faEye, 
  faEyeSlash, 
  faUserSlash, 
  faBed, 
  faMoon, 
  faUserCheck, 
  faToggleOn, 
  faToggleOff, 
  faSpinner, 
  faExclamationTriangle,
  faLock,
  faMask
} from '@fortawesome/free-solid-svg-icons';
import { useAttention } from '../../context/AttentionContext';
import { SocketContext } from '../../context/SocketContext';
import AttentionSyncStatus from './AttentionSyncStatus';

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

const ParticipantAttention = ({ participant, attentionData }) => {
  const userData = attentionData?.[participant.id];
  
  if (!userData || !participant.id) {
    return null;
  }
  
  const displayName = participant.displayName;
  
  const { attentionState, attentionCategory, attentionPercentage, confidence } = userData;
  const formattedPercentage = Math.round(attentionPercentage || 0);
  
  return (
    <div className="attention-item d-flex align-items-center mb-2 p-2 border-bottom">
      <div className="avatar me-2 rounded-circle d-flex align-items-center justify-content-center" style={{ width: 40, height: 40 }}>
        <span className="avatar-text">{displayName?.charAt(0)?.toUpperCase() || '?'}</span>
      </div>
      <div className="participant-info flex-grow-1">
        <div className="participant-name fw-medium">{displayName}</div>
        <div className="d-flex align-items-center mt-1">
          <div className="progress flex-grow-1 me-2" style={{ height: 8 }}>
            <div 
              className={`progress-bar ${getAttentionColorClass(attentionState)}`}
              role="progressbar" 
              style={{ width: `${formattedPercentage}%` }}
              aria-valuenow={formattedPercentage} 
              aria-valuemin="0" 
              aria-valuemax="100"
            ></div>
          </div>
          <span className="percentage-text small">{formattedPercentage}%</span>
        </div>
      </div>
      <div className="attention-state ms-2">
        <div className="d-flex align-items-center">
          <AttentionStatusIcon state={attentionState} />
          <span className={`badge ms-1 ${getAttentionColorClass(attentionState)}`}>
          {getAttentionLabel(attentionState)}
        </span>
        </div>
      </div>
    </div>
  );
};

const AttentionMonitor = () => {
  const { 
    isMonitoringEnabled, 
    toggleMonitoring, 
    attentionData, 
    roomAttentionData, 
    isLoading, 
    error,
    calibrateAttention
  } = useAttention();
  
  const socketContext = useContext(SocketContext);
  const { participants, socket, isRoomCreator } = socketContext || {};
  
  useEffect(() => {
    if (isMonitoringEnabled && socket && !Object.keys(attentionData).length) {
      calibrateAttention();
    }
  }, [isMonitoringEnabled, socket, attentionData, calibrateAttention]);
  
  const combinedData = {
    ...roomAttentionData?.attention,
    ...attentionData
  };
  
  const localUserId = socket?.id;
  const localData = localUserId ? combinedData[localUserId] : null;
  
  const validParticipants = participants.filter(p => 
    p.id && p.id !== localUserId && combinedData[p.id]
  );
  
  return (
    <div className="attention-monitor-container">
      <div className="card">
        <div className="card-header d-flex align-items-center justify-content-between">
          <h5 className="mb-0">
            Attention Monitor
            {isRoomCreator && (
              <span className="badge bg-primary ms-2 small">Host View</span>
            )}
          </h5>
          <button 
            className={`btn btn-sm ${isMonitoringEnabled ? 'btn-primary' : 'btn-outline-secondary'}`}
            onClick={toggleMonitoring}
            disabled={isLoading}
          >
            {isLoading ? (
              <FontAwesomeIcon icon={faSpinner} spin className="me-1" />
            ) : (
              <FontAwesomeIcon icon={isMonitoringEnabled ? faToggleOn : faToggleOff} className="me-1" />
            )}
            {isMonitoringEnabled ? 'On' : 'Off'}
          </button>
        </div>
        
        <div className="card-body">
          {error && (
            <div className="alert alert-danger" role="alert">
              <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
              {error}
            </div>
          )}
          
          {!isMonitoringEnabled ? (
            <div className="text-center text-muted py-3">
              <FontAwesomeIcon icon={faEyeSlash} className="d-block mb-2 fa-2x" />
              <p>Attention monitoring is disabled</p>
              <button 
                className="btn btn-sm btn-primary" 
                onClick={toggleMonitoring}
              >
                Enable Monitoring
              </button>
            </div>
          ) : (
            <>
              <div className="attention-overview mb-3 p-3 border-bottom">
                <h6 className="mb-2">Your Attention</h6>
                {localData ? (
                  <div className="d-flex align-items-center">
                    <AttentionStatusIcon state={localData.attentionState} />
                    <div className="ms-2 flex-grow-1">
                      <span className={`badge ${getAttentionColorClass(localData.attentionState)}`}>
                        {getAttentionLabel(localData.attentionState)}
                      </span>
                      <div className="progress mt-1" style={{ height: '8px' }}>
                        <div 
                          className={`progress-bar ${getAttentionColorClass(localData.attentionState)}`} 
                          style={{ width: `${Math.round(localData.attentionPercentage || 0)}%` }}
                          role="progressbar" 
                          aria-valuenow={Math.round(localData.attentionPercentage || 0)} 
                          aria-valuemin="0" 
                          aria-valuemax="100">
                        </div>
                      </div>
                      <div className="mt-1 text-end small">
                        <span className="percentage-text">{Math.round(localData.attentionPercentage || 0)}%</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-muted small">
                    <FontAwesomeIcon icon={faSpinner} spin className="me-1" />
                    Analyzing...
                  </div>
                )}
              </div>
              
              {validParticipants.length > 0 && <AttentionSyncStatus />}
              
              {isRoomCreator ? (
                <>
                  <h6>Participants</h6>
                  <div className="attention-list">
                    {validParticipants.length > 0 ? (
                      validParticipants.map(participant => (
                        <ParticipantAttention 
                          key={participant.id} 
                          participant={participant} 
                          attentionData={combinedData} 
                        />
                      ))
                    ) : (
                      <div className="text-muted small py-3 text-center">
                        No other participants
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center text-muted py-3 border-top mt-3">
                  <FontAwesomeIcon icon={faLock} className="d-block mb-2 mt-3 fa-2x" />
                  <p>Participant attention data is only visible to the room host</p>
                </div>
              )}
              
              <div className="text-center mt-3">
                <button 
                  className="btn btn-sm btn-outline-primary" 
                  onClick={calibrateAttention}
                  disabled={isLoading}
                >
                  {isLoading && <FontAwesomeIcon icon={faSpinner} spin className="me-1" />}
                  Recalibrate
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AttentionMonitor; 