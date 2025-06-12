import React, { useContext, useEffect } from 'react';
import { SocketContext } from '../../context/SocketContext';

const ChatMessage = ({ message }) => {
  const { socket, participants } = useContext(SocketContext);
  
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  const isOutgoing = message.sender?.id === socket?.id;
  
  const isSystem = message.type === 'system';
  
  const getSenderName = () => {
    const messageData = {
      messageDisplayName: message.displayName,
      senderDisplayName: message.sender?.displayName,
      senderName: message.senderName,
      participants: participants.map(p => ({ id: p.id, name: p.displayName })),
      matchingParticipant: participants.find(p => p.id === message.sender?.id)
    };
    console.log(`Resolving name for message from ${message.sender?.id}:`, messageData);
    
    if (message.sender?.displayName && message.sender.displayName !== 'Anonymous') {
      return message.sender.displayName;
    }
    
    if (message.displayName && message.displayName !== 'Anonymous') {
      return message.displayName;
    }
    
    if (message.senderName && message.senderName !== 'Anonymous') {
      return message.senderName;
    }
    
    if (message.sender?.id && participants && participants.length > 0) {
      const participant = participants.find(p => p.id === message.sender.id);
      if (participant?.displayName && participant.displayName !== 'Anonymous') {
        return participant.displayName;
      }
    }
    
    if (isOutgoing) {
      const localName = localStorage.getItem('displayName');
      if (localName && localName !== 'Anonymous') {
        return localName;
      }
      return "You";
    }
    
    return 'Anonymous';
  };
  
  useEffect(() => {
    if (!isSystem) {
      console.log('Current participants:', participants);
    }
  }, [participants, isSystem]);
  
  if (isSystem) {
    return (
      <div className="system-message text-center my-2 p-2" style={{ backgroundColor: 'rgba(50, 50, 72, 0.5)', borderRadius: '8px' }}>
        <small className="text-muted">{message.text}</small>
      </div>
    );
  }
  
  const senderName = getSenderName();
  
  return (
    <div className={`message-wrapper ${isOutgoing ? 'outgoing' : 'incoming'}`}>
      <div className="d-flex align-items-start">
        <div 
          className="avatar me-2 rounded-circle d-flex align-items-center justify-content-center" 
          style={{ 
            width: 32, 
            height: 32, 
            backgroundColor: isOutgoing ? '#3949AB' : '#323248',
            color: '#e0e0e0',
            flexShrink: 0
          }}
        >
          <span>{senderName.charAt(0).toUpperCase()}</span>
        </div>
        
        <div className="message-content-wrapper flex-grow-1">
          <div className="sender-name small mb-1">
            <span className="fw-bold">
              {senderName}
            </span>
            {isOutgoing && (
              <span className="badge ms-2" style={{ backgroundColor: '#3949AB', color: '#000', fontSize: '0.6rem' }}>You</span>
            )}
          </div>
          
          <div 
            className={`message p-2 ${isOutgoing ? 'outgoing' : 'incoming'}`}
            style={{
              backgroundColor: isOutgoing ? '#3949AB' : '#323248',
              color: '#e0e0e0',
              borderRadius: '8px',
              maxWidth: '100%',
              display: 'inline-block'
            }}
          >
            <div className="message-text">{message.text || ''}</div>
            <div className="message-time text-end small opacity-75 mt-1">
              {formatTime(message.timestamp || message.time || Date.now())}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatMessage; 