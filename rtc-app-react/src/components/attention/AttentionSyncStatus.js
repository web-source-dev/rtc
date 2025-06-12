import React, { useContext } from 'react';
import { useAttention } from '../../context/AttentionContext';
import { SocketContext } from '../../context/SocketContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCircleCheck, 
  faTriangleExclamation, 
  faCircleXmark,
  faSpinner,
  faPeopleGroup,
  faUser
} from '@fortawesome/free-solid-svg-icons';

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

const getGroupLabel = (group) => {
  switch(group) {
    case 'attentive':
      return 'Attentive';
    case 'active':
      return 'Active';
    case 'distracted':
      return 'Distracted';
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

const getSyncIcon = (level, isLoading) => {
  if (isLoading) return <FontAwesomeIcon icon={faSpinner} spin />;
  
  switch (level) {
    case 'high':
      return <FontAwesomeIcon icon={faCircleCheck} className="text-success" />;
    case 'medium':
      return <FontAwesomeIcon icon={faTriangleExclamation} className="text-warning" />;
    case 'low':
      return <FontAwesomeIcon icon={faCircleXmark} className="text-danger" />;
    default:
      return <FontAwesomeIcon icon={faTriangleExclamation} className="text-secondary" />;
  }
};

const AttentionSyncStatus = () => {
  const { attentionData, roomAttentionData, isMonitoringEnabled, isLoading, calculateSyncLevel } = useAttention();
  const { participants, socket, isRoomCreator } = useContext(SocketContext) || {};
  
  if (!isMonitoringEnabled || !isRoomCreator) return null;
  
  const syncInfo = calculateSyncLevel();
  
  const realParticipants = participants?.filter(p => p.id && p.stream);
  if (syncInfo.level === 'unknown' || !realParticipants || realParticipants.length === 0) {
    return null;
  }
  
  return (
    <div className="attention-sync-status card mb-4">
      <div className="card-header">
        Group Attention Synchronization
      </div>
      <div className="card-body">
        <div className="row">
          <div className="col-md-4 text-center">
            <div className="mb-2">{getSyncIcon(syncInfo.level, isLoading)}</div>
            <h5 className={`mb-0 text-${syncInfo.level === 'high' ? 'success' : syncInfo.level === 'medium' ? 'warning' : 'danger'}`}>
              {syncInfo.level === 'high' ? 'High Sync' : syncInfo.level === 'medium' ? 'Medium Sync' : 'Low Sync'}
            </h5>
            <div className="small text-muted">
              {Math.round(syncInfo.groupPercentage)}% in sync
            </div>
          </div>
          
          <div className="col-md-4 text-center border-start border-end">
            <div className="mb-2">
              <FontAwesomeIcon icon={faPeopleGroup} className="text-primary" />
            </div>
            <h5 className="mb-0">
              Dominant Group
            </h5>
            <div className="badge mt-1 mb-1" 
              style={{ 
                backgroundColor: syncInfo.dominantGroup === 'attentive' || syncInfo.dominantGroup === 'active' ? '#28a745' : 
                                  syncInfo.dominantGroup === 'distracted' || syncInfo.dominantGroup === 'drowsy' ? '#ffc107' : 
                                  syncInfo.dominantGroup === 'darkness' ? '#6c757d' : '#dc3545',
                color: '#000'
              }}
            >
              {getGroupLabel(syncInfo.dominantGroup)}
            </div>
          </div>
          
          <div className="col-md-4 text-center">
            <div className="mb-2">
              <FontAwesomeIcon icon={faUser} className="text-primary" />
            </div>
            <h5 className="mb-0">
              Top State
            </h5>
            <div className="badge mt-1 mb-1" 
              style={{ 
                backgroundColor: syncInfo.dominantState === 'attentive' || syncInfo.dominantState === 'active' ? '#28a745' : 
                                  syncInfo.dominantState === 'looking_away' || syncInfo.dominantState === 'drowsy' ? '#ffc107' : 
                                  syncInfo.dominantState === 'darkness' ? '#6c757d' : '#dc3545',
                color: '#000'
              }}
            >
              {syncInfo.dominantState ? syncInfo.dominantState.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Unknown'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttentionSyncStatus; 