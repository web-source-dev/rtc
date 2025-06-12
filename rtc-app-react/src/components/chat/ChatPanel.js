import React, { useState, useContext, useEffect, useRef } from 'react';
import { SocketContext } from '../../context/SocketContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPaperPlane, 
  faXmark, 
  faCircle, 
  faSmile 
} from '@fortawesome/free-solid-svg-icons';
import ChatMessage from './ChatMessage';
import './ChatPanel.css';

const ChatPanel = ({ isVisible, onClose }) => {
  const [newMessage, setNewMessage] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState(null);
  const [typingStatus, setTypingStatus] = useState({});
  
  const { messages, sendChatMessage, socket } = useContext(SocketContext);
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const prevMessagesLengthRef = useRef(messages.length);
  
  useEffect(() => {
    if (socket) {
      const handleTypingEvent = (data) => {
        if (data.userId !== socket.id) {
          setIsTyping(data.isTyping);
          setTypingStatus(data.typingStatus || {});
        }
      };
      
      socket.on('user-typing', handleTypingEvent);
      
      return () => {
        socket.off('user-typing', handleTypingEvent);
      };
    }
  }, [socket]);
  
  useEffect(() => {
    if (messagesEndRef.current && isVisible) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
    
    if (!isVisible && messages.length > prevMessagesLengthRef.current) {
      setUnreadCount(prev => prev + (messages.length - prevMessagesLengthRef.current));
    }
    
    prevMessagesLengthRef.current = messages.length;
  }, [messages, isVisible]);
  
  useEffect(() => {
    if (isVisible) {
      setUnreadCount(0);
    }
  }, [isVisible]);
  
  useEffect(() => {
    if (isVisible && inputRef.current) {
      setTimeout(() => {
        inputRef.current.focus();
      }, 300);
    }
  }, [isVisible]);
  
  const handleTyping = () => {
    if (socket) {
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }
      
      socket.emit('typing', { isTyping: true });
      
      const timeout = setTimeout(() => {
        socket.emit('typing', { isTyping: false });
      }, 2000);
      
      setTypingTimeout(timeout);
    }
  };
  
  const handleSendMessage = () => {
    if (newMessage.trim()) {
      sendChatMessage(newMessage.trim());
      setNewMessage('');
      
      if (socket && typingTimeout) {
        clearTimeout(typingTimeout);
        socket.emit('typing', { isTyping: false });
      }
    }
  };
  
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    } else {
      handleTyping();
    }
  };
  
  const typingUsers = Object.entries(typingStatus || {})
    .filter(([id]) => id !== socket?.id)
    .map(([_, name]) => name || 'Someone');
  
  return (
    <div className={`chat-container bg-dark ${isVisible ? 'show' : ''}`} style={{ backgroundColor: '#252536', color: '#e0e0e0' }}>
      <div className="chat-header p-3 d-flex justify-content-between align-items-center border-bottom" style={{ backgroundColor: '#2a2a42', borderColor: '#323248' }}>
        <h5 className="mb-0">Class Chat</h5>
        <button 
          id="close-chat-btn" 
          className="btn text-light p-0" 
          onClick={onClose}
          aria-label="Close chat"
        >
          <FontAwesomeIcon icon={faXmark} />
        </button>
      </div>
      
      <div id="chat-messages" className="chat-messages p-3" style={{ backgroundColor: '#252536' }}> 
        {messages.filter(msg => msg && (msg.text || msg.message)).map((message, index) => (
          <ChatMessage key={`message-${message.id || index}`} message={message} />
        ))}
        
        {typingUsers.length > 0 && (
          <div className="typing-indicator d-flex align-items-center p-2 text-white-50 mb-2">
            <div className="d-flex align-items-start">
              <div className="avatar me-2 rounded-circle d-flex align-items-center justify-content-center" 
                style={{ 
                  width: 32, 
                  height: 32, 
                  backgroundColor: '#323248',
                  color: '#e0e0e0',
                  flexShrink: 0
                }}>
                <span>...</span>
              </div>
              
              <div className="typing-content p-2 rounded" style={{ backgroundColor: 'rgba(50, 50, 72, 0.7)' }}>
                <span>{typingUsers.length === 1 
                  ? `${typingUsers[0] || 'Someone'} is typing` 
                  : `${typingUsers.length} people are typing`}
                </span>
                <div className="dot-animation ms-2 d-inline-block">
                  <span className="dot"></span>
                  <span className="dot"></span>
                  <span className="dot"></span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      <div className="chat-input-container p-3 border-top" style={{ borderColor: '#323248', backgroundColor: '#2a2a42' }}>
        <div className="input-group">
          <input 
            type="text" 
            id="chat-input" 
            className="form-control" 
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            ref={inputRef}
            style={{ backgroundColor: '#323248', color: '#e0e0e0', border: 'none' }}
          />
          <button 
            id="send-message-btn" 
            className="btn btn-primary"
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
          >
            <FontAwesomeIcon icon={faPaperPlane} />
          </button>
        </div>
      </div>
      
      {!isVisible && unreadCount > 0 && (
        <div 
          className="unread-badge position-absolute d-flex align-items-center justify-content-center"
          style={{
            top: '10px',
            left: '-10px',
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            backgroundColor: '#dc3545',
            color: '#ffffff',
            fontSize: '0.75rem',
            fontWeight: 'bold',
            zIndex: 1050
          }}
        >
          {unreadCount}
        </div>
      )}
    </div>
  );
};

export default ChatPanel; 