import React, { createContext, useState, useRef, useEffect, useCallback, useContext } from 'react';
import { io } from 'socket.io-client';
import { useAppState, ERROR_TYPES } from '../hooks/useAppState';
import { useAuth } from './AuthContext';

export const SocketContext = createContext();

const configuration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
    {
      urls: 'turn:numb.viagenie.ca',
      credential: 'muazkh',
      username: 'webrtc@live.com'
    }
  ],
  iceCandidatePoolSize: 10
};

export const SocketContextProvider = ({ children }) => {
  const { startLoading, stopLoading, setAppError, clearError, addNotification } = useAppState();
  const { user, token, isAuthenticated } = useAuth();
  
  const [socket, setSocket] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const [roomId, setRoomId] = useState('');
  const [isRoomCreator, setIsRoomCreator] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [messages, setMessages] = useState([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [selectedCamera, setSelectedCamera] = useState('');
  const [selectedMicrophone, setSelectedMicrophone] = useState('');
  
  const peerConnections = useRef({});
  const dataChannels = useRef({});
  const screenStream = useRef(null);
  const originalStream = useRef(null);
  const attentionHandler = useRef(null);

  const normalizeDisplayName = (name) => {
    console.log('Normalizing display name:', name);
    
    if (isAuthenticated && user?.name) {
      return user.name;
    }
    
    if (name && typeof name === 'string' && name.trim() !== '' && name.trim() !== 'Anonymous') {
      const trimmedName = name.trim().substring(0, 30);
      console.log(`Using provided name: "${trimmedName}"`);
      return trimmedName;
    }
    
    const storedName = localStorage.getItem('displayName');
    if (storedName && storedName.trim() !== '' && storedName.trim() !== 'Anonymous') {
      console.log(`Using stored name from localStorage: "${storedName.trim().substring(0, 30)}"`);
      return storedName.trim().substring(0, 30);
    }
    
    console.log('Defaulting to "Anonymous"');
    return 'Anonymous';
  };
  
  const addSystemMessage = useCallback((text) => {
    setMessages(prev => [
      ...prev,
      {
        id: `system-${Date.now()}`,
        type: 'system',
        text,
        timestamp: Date.now(),
        sender: {
          id: 'system',
          displayName: 'System'
        }
      }
    ]);
  }, []);
  
  const registerAttentionHandler = useCallback((handler) => {
    attentionHandler.current = handler;
  }, []);
  
  const unregisterAttentionHandler = useCallback(() => {
    attentionHandler.current = null;
  }, []);
  
  const setupDataChannel = useCallback((dataChannel, userId) => {
    dataChannels.current[userId] = dataChannel;
    
    dataChannel.onopen = () => {
      console.log(`Data channel to ${userId} opened`);
    };
    
    dataChannel.onclose = () => {
      console.log(`Data channel to ${userId} closed`);
    };
    
    dataChannel.onerror = (error) => {
      console.error(`Data channel error for ${userId}:`, error);
    };
    
    dataChannel.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        
        switch (message.type) {
          case 'chat':
            const senderId = message.userId || message.from || (message.sender && message.sender.id);
            
            const senderDisplayName = 
              message.displayName || 
              (message.sender && message.sender.displayName) || 
              (participants.find(p => p.id === senderId)?.displayName) || 
              'Anonymous';
            
            const chatMessage = {
              id: `${senderId}-${Date.now()}`,
              type: 'chat',
              text: message.text,
              timestamp: message.timestamp || Date.now(),
              sender: {
                id: senderId,
                displayName: senderDisplayName
              }
            };
            setMessages(prev => [...prev, chatMessage]);
            break;
          case 'attention':
            if (attentionHandler.current && message.userId && message.data) {
              attentionHandler.current(message.userId, message.data);
            }
            break;
          default:
            console.log(`Unknown data channel message type: ${message.type}`);
        }
      } catch (error) {
        console.error('Error parsing data channel message:', error);
      }
    };
  }, [attentionHandler, participants]);
  
  const createPeerConnection = useCallback((userId, displayName) => {
    console.log(`Creating peer connection for ${userId} (${displayName})`);
    
    try { 
      if (peerConnections.current[userId]) {
        console.log(`Peer connection for ${userId} already exists, reusing...`);
        return peerConnections.current[userId];
      }
      
      setParticipants(prev => {
        const exists = prev.some(p => p.id === userId);
        if (!exists) {
          console.log(`Adding participant ${userId} (${displayName}) to participants list`);
          return [...prev, { 
            id: userId, 
            displayName: displayName || 'Anonymous',
            hasStream: false
          }];
        }
        return prev;
      });
      
      const peerConnection = new RTCPeerConnection(configuration);
      peerConnections.current[userId] = peerConnection;
      
      const dataChannel = peerConnection.createDataChannel('chat', { 
        negotiated: true, 
        id: 0 
      });
      setupDataChannel(dataChannel, userId);
      
      if (localStream) {
        localStream.getTracks().forEach(track => {
          console.log(`Adding ${track.kind} track to peer connection for ${userId}`);
          peerConnection.addTrack(track, localStream);
        });
      }
      
      peerConnection.onicecandidate = (event) => {
        if (event.candidate && socket) {
          // Prioritize user context for display name
          const myDisplayName = user?.name || localStorage.getItem('displayName') || 'Anonymous';
          
          socket.emit('ice-candidate', {
            target: userId,
            candidate: event.candidate,
            displayName: myDisplayName
          });
        }
      };
      
      peerConnection.oniceconnectionstatechange = () => {
        console.log(`ICE connection state changed to ${peerConnection.iceConnectionState} for peer ${userId}`);
        
        if (peerConnection.iceConnectionState === 'disconnected') {
          addNotification(`Connection issue with ${displayName}`, 'warning');
          
          if (peerConnection.restartIce) {
            setTimeout(() => {
              if (peerConnection.iceConnectionState !== 'connected' && 
                  peerConnection.iceConnectionState !== 'completed') {
                peerConnection.restartIce();
              }
            }, 2000);
          }
        } else if (peerConnection.iceConnectionState === 'failed') {
          setAppError(
            ERROR_TYPES.PEER_CONNECTION,
            `Connection failed with ${displayName}`,
            { userId, state: peerConnection.iceConnectionState }
          );
        } else if (peerConnection.iceConnectionState === 'connected' || 
                   peerConnection.iceConnectionState === 'completed') {
          clearError();
        }
      };
      
      peerConnection.ontrack = (event) => {
        console.log(`Received ${event.track.kind} track from ${userId}`);
        
        const stream = event.streams[0];
        
        if (!stream) {
          console.error(`No stream in track event for ${userId}`);
          return;
        }
        
        console.log(`Adding stream to participant ${userId} - video tracks: ${stream.getVideoTracks().length}, audio tracks: ${stream.getAudioTracks().length}`);
        
        updateParticipantStream(userId, stream, displayName);
      };
      
      peerConnection.ondatachannel = (event) => {
        setupDataChannel(event.channel, userId);
      };
      
      return peerConnection;
    } catch (error) {
      setAppError(
        ERROR_TYPES.PEER_CONNECTION,
        `Failed to create connection with ${displayName}`,
        error.message
      );
      return null;
    }
  }, [socket, localStream, addNotification, setAppError, clearError, setupDataChannel]);
  
  const createOffer = useCallback(async (userId) => {
    try {
      const peerConnection = peerConnections.current[userId];
      
      if (!peerConnection) {
        console.error(`No peer connection found for ${userId}`);
        return;
      }
      
      const displayName = localStorage.getItem('displayName') || 'Anonymous';
      
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      
      if (socket) {
        console.log(`Sending offer to ${userId} with display name: ${displayName}`);
        socket.emit('offer', { 
          target: userId, 
          offer,
          displayName 
        });
      }
    } catch (error) {
      console.error('Error creating offer:', error);
    }
  }, [socket]);
  
  const restoreRoom = useCallback(() => {
    console.log(`Attempting to restore room: ${roomId}`);
    
    if (socket && roomId) {
      socket.emit('rejoin-room', { roomId });
    }
  }, [socket, roomId]);
  
  const handleRoomCreated = useCallback((data) => {
    const { roomId: createdRoomId, password, participants: roomParticipants } = data;
    
    if (socket && socket.joinRoomTimeout) {
      clearTimeout(socket.joinRoomTimeout);
      socket.joinRoomTimeout = null;
    }
    
    console.log(`Room created: ${createdRoomId}`);
    
    setRoomId(createdRoomId);
    setIsRoomCreator(true);
    
    // Clear any previous participants
    setParticipants([]);
    
    // Add the participants from the room with their correct display names
    if (roomParticipants && Array.isArray(roomParticipants)) {
      console.log('Room participants:', roomParticipants);
      
      setParticipants(roomParticipants.map(p => {
        // Ensure we have valid display names for all participants
        const displayName = p.displayName || 'Anonymous';
        console.log(`Adding participant ${p.id} with name "${displayName}"`);
        
        return {
      id: p.id,
          displayName: displayName,
          hasStream: false
        };
    }));
    }
    
    // Store room info in session storage for potential reconnection
    sessionStorage.setItem('rtc_room_id', createdRoomId);
    sessionStorage.setItem('rtc_room_creator', 'true');
    
    if (password) {
      sessionStorage.setItem('rtc_room_password', password);
    }
    
    stopLoading();
    addNotification(`Room created: ${createdRoomId}`, 'success');
    
    // Add system message to chat
    addSystemMessage(`You created room ${createdRoomId}`);
    
    // Make sure my display name is properly set
    const myDisplayName = user?.name || localStorage.getItem('displayName') || 'Anonymous';
    socket.emit('user-joined', {
      displayName: myDisplayName
    });
  }, [socket, stopLoading, addNotification, addSystemMessage, user]);
  
  const handleRoomJoined = useCallback((data) => {
    const { roomId: joinedRoomId, participants: roomParticipants, isPasswordProtected } = data;
    
    if (socket && socket.joinRoomTimeout) {
      clearTimeout(socket.joinRoomTimeout);
      socket.joinRoomTimeout = null;
    }
    
    console.log(`Joined room: ${joinedRoomId} with ${roomParticipants?.length || 0} participants`);
    
    setRoomId(joinedRoomId);
    setIsRoomCreator(false);
    
    // Clear any previous participants
    setParticipants([]);
    
    // Add the participants from the room with their correct display names
    if (roomParticipants && Array.isArray(roomParticipants)) {
      console.log('Room participants:', roomParticipants);
      
      setParticipants(roomParticipants.map(p => {
        // Ensure we have valid display names for all participants
        const displayName = p.displayName || 'Anonymous';
        console.log(`Adding participant ${p.id} with name "${displayName}"`);
        
        return {
          id: p.id,
          displayName: displayName,
          hasStream: false
        };
      }));
    }
    
    // Store room info in session storage for potential reconnection
    sessionStorage.setItem('rtc_room_id', joinedRoomId);
    
    stopLoading();
    addNotification(`Joined room: ${joinedRoomId}`, 'success');
    
    // Add system message to chat
    addSystemMessage(`You joined room ${joinedRoomId}`);
    
    // Broadcast my display name to all participants
    const myDisplayName = user?.name || localStorage.getItem('displayName') || 'Anonymous';
    socket.emit('user-joined', {
      displayName: myDisplayName
    });
  }, [socket, stopLoading, addNotification, addSystemMessage, user]);
  
  const handleUserJoined = useCallback(({ userId, displayName }) => {
    console.log(`User joined: ${userId} (${displayName || 'Unknown'})`);
    
    setParticipants(prev => {
      const existingParticipant = prev.find(p => p.id === userId);
      
      if (existingParticipant) {
        // Update the existing participant's display name if it's provided and different
        if (displayName && existingParticipant.displayName !== displayName) {
          console.log(`Updating existing participant ${userId} name to "${displayName}"`);
          return prev.map(p => 
            p.id === userId ? { ...p, displayName } : p
          );
        }
        return prev;
      }
      
      console.log(`Adding new participant ${userId} with name "${displayName || 'Unknown'}"`);
        return [...prev, { 
          id: userId, 
        displayName: displayName || 'Anonymous'
      }];
    });
  }, []);

  const handleUserLeft = useCallback(({ userId }) => {
    const participant = participants.find(p => p.id === userId);
    const displayName = participant ? participant.displayName : 'Unknown';
    
    console.log(`User left: ${userId} (${displayName})`);
    
    if (peerConnections.current[userId]) {
      peerConnections.current[userId].close();
      delete peerConnections.current[userId];
    }
    
    if (dataChannels.current[userId]) {
      dataChannels.current[userId].close();
      delete dataChannels.current[userId];
    }
    
    setParticipants(prev => {
      const withoutUser = prev.filter(p => p.id !== userId);
      
      if (participant) {
        const sameNameParticipants = withoutUser.filter(p => 
          p.displayName === participant.displayName
        );
        
        if (sameNameParticipants.length > 0 && sameNameParticipants.every(p => p.inactive)) {
          console.log(`Removing all inactive participants with name "${participant.displayName}"`);
          return withoutUser.filter(p => p.displayName !== participant.displayName);
        }
      }
      
      return withoutUser;
    });

    addSystemMessage(`${displayName} left the room`);
  }, [participants, addSystemMessage]);

  const handleUserInactive = useCallback(({ userId, displayName }) => {
    console.log(`User inactive: ${userId} (${displayName})`);
    
    const normalizedName = normalizeDisplayName(displayName);
    
    setParticipants(prev => {
      const existingIndex = prev.findIndex(p => p.id === userId);
      
      if (existingIndex === -1) {
        console.log(`User ${userId} not found in participants, cannot mark as inactive`);
        return prev;
      }
      
      const duplicateInactiveParticipants = prev.filter(
        p => p.id !== userId && 
            p.displayName === normalizedName && 
            p.inactive
      );
      
      if (duplicateInactiveParticipants.length > 0) {
        console.log(`Found ${duplicateInactiveParticipants.length} duplicate inactive participants with name "${normalizedName}"`);
        
        return prev
          .filter(p => !(p.displayName === normalizedName && p.inactive))
          .map(p => {
            if (p.id === userId) {
              return { ...p, inactive: true, inactiveSince: Date.now() };
            }
            return p;
          });
      }
      
      return prev.map(p => {
        if (p.id === userId) {
          return { ...p, inactive: true, inactiveSince: Date.now() };
        }
        return p;
      });
    });
    
    addSystemMessage(`${normalizedName} is temporarily disconnected`);
  }, [addSystemMessage, normalizeDisplayName]);

  const handleUserRejoined = useCallback(({ userId, displayName, previousId }) => {
    const normalizedName = normalizeDisplayName(displayName);
    console.log(`User rejoined: ${userId} (was ${previousId}) with name "${normalizedName}"`);
    
    setParticipants(prev => {
      const inactiveIndex = prev.findIndex(p => p.id === previousId && p.inactive);
      
      const staleIndices = prev
        .map((p, idx) => idx)
        .filter(idx => 
          prev[idx].displayName === normalizedName && 
          prev[idx].id !== userId && 
          prev[idx].inactive
        );
      
        const newUserIndex = prev.findIndex(p => p.id === userId);
      
      let updated = [...prev];
      
      if (inactiveIndex >= 0) {
        console.log(`Removing inactive participant with ID ${previousId}`);
        updated = updated.filter(p => p.id !== previousId);
      }
      
      if (staleIndices.length > 0) {
        console.log(`Removing ${staleIndices.length} stale duplicate entries`);
        staleIndices.sort((a, b) => b - a).forEach(idx => {
          const staleId = updated[idx]?.id;
          if (staleId) {
            console.log(`Removing stale participant with ID ${staleId}`);
            updated = updated.filter(p => p.id !== staleId);
          }
        });
      }
      
      if (newUserIndex < 0) {
        console.log(`Adding new participant with ID ${userId} (was ${previousId})`);
        updated.push({ 
          id: userId, 
          displayName: normalizedName,
          inactive: false,
          previousId: previousId
        });
      } else {
        console.log(`Updating existing participant with ID ${userId}`);
        updated[newUserIndex] = {
          ...updated[newUserIndex],
          displayName: normalizedName,
          inactive: false,
          previousId: previousId
        };
      }
      
      return updated;
    });
    
    if (localStream) {
      if (peerConnections.current[previousId]) {
        console.log(`Closing existing peer connection for old ID ${previousId}`);
        peerConnections.current[previousId].close();
        delete peerConnections.current[previousId];
      }
      
      if (dataChannels.current[previousId]) {
        console.log(`Closing existing data channel for old ID ${previousId}`);
        dataChannels.current[previousId].close();
        delete dataChannels.current[previousId];
      }
      
      if (peerConnections.current[userId]) {
        console.log(`Closing existing peer connection for new ID ${userId}`);
        peerConnections.current[userId].close();
        delete peerConnections.current[userId];
      }
      
      if (dataChannels.current[userId]) {
        console.log(`Closing existing data channel for new ID ${userId}`);
        dataChannels.current[userId].close();
        delete dataChannels.current[userId];
      }
      
      Object.entries(peerConnections.current).forEach(([id, pc]) => {
        const p = participants.find(p => p.id === id);
        if (p && p.displayName === normalizedName && id !== userId && id !== previousId) {
          console.log(`Closing duplicate peer connection for ID ${id} with same name`);
          pc.close();
          delete peerConnections.current[id];
          
          if (dataChannels.current[id]) {
            dataChannels.current[id].close();
            delete dataChannels.current[id];
          }
        }
      });
      
      console.log(`Creating new peer connection for rejoined user ${userId} (was ${previousId})`);
      createPeerConnection(userId, normalizedName);
      
      socket.emit('ready', { 
        roomId,
        displayName: user?.name || localStorage.getItem('displayName') || 'Anonymous'
      });
    }
    
    addSystemMessage(`${normalizedName} reconnected to the room`);
    
    addNotification(`${normalizedName} reconnected to the room`, 'info');
  }, [addNotification, localStream, createPeerConnection, addSystemMessage, socket, roomId, participants]);

  const handleUserReady = useCallback(({ userId, displayName }) => {
    console.log(`User ready for WebRTC: ${userId} (${displayName || 'Unknown'})`);
    
    const normalizedName = displayName || 'Anonymous';
    
    setParticipants(prev => {
      const exists = prev.some(p => p.id === userId);
      if (!exists) {
        console.log(`Adding participant ${userId} (${normalizedName}) to participants list from user ready`);
        return [...prev, { 
          id: userId, 
          displayName: normalizedName,
          hasStream: false
        }];
      }
      return prev;
    });
    
      createPeerConnection(userId, normalizedName);
    
    createOffer(userId);
  }, [createPeerConnection, createOffer]);

  const handleRoomError = useCallback(({ message, code }) => {
    if (socket && socket.joinRoomTimeout) {
      clearTimeout(socket.joinRoomTimeout);
      socket.joinRoomTimeout = null;
    }
    
    stopLoading();
    setAppError(
      ERROR_TYPES.ROOM_CONNECTION,
      message || 'Error connecting to room',
      { code }
    );
  }, [setAppError, stopLoading, socket]);

  const handleSocketError = useCallback(({ message, details }) => {
    console.error('Socket error:', message, details);
    
    if (socket && socket.joinRoomTimeout) {
      clearTimeout(socket.joinRoomTimeout);
      socket.joinRoomTimeout = null;
    }
    
    stopLoading();
    setAppError(
      ERROR_TYPES.SERVER_CONNECTION,
      message || 'Socket error',
      details
    );
  }, [setAppError, stopLoading, socket]);

  const handleOffer = useCallback(async ({ from, offer, displayName }) => {
    console.log(`Received offer from: ${from} (${displayName || 'Unknown'})`);
    
    try {
      let peerConnection = peerConnections.current[from];
      
      if (displayName) {
        console.log(`Updating participant ${from} name to "${displayName}" from offer`);
        setParticipants(prev => {
          const existing = prev.find(p => p.id === from);
          if (!existing) {
            return [...prev, { 
              id: from, 
              displayName: displayName,
              hasStream: false
            }];
          }
          return prev.map(p => p.id === from ? { ...p, displayName } : p);
        });
      }
      
      if (!peerConnection) {
        const participant = participants.find(p => p.id === from);
        
        const participantName = displayName || participant?.displayName || 'Peer';
        
        if (!participant) {
          console.log(`Adding participant ${from} (${participantName}) to participants list from offer`);
          setParticipants(prev => {
            return [...prev, { 
              id: from, 
              displayName: participantName,
              hasStream: false
            }];
          });
        } else if (displayName && participant.displayName !== displayName) {
          console.log(`Updating participant ${from} name from "${participant.displayName}" to "${displayName}" from offer`);
          setParticipants(prev => {
            return prev.map(p => {
              if (p.id === from) {
                return { ...p, displayName };
              }
              return p;
            });
          });
        }
        
        peerConnection = createPeerConnection(from, participantName);
      } else if (displayName) {
        console.log(`Updating existing participant ${from} name to "${displayName}" from offer`);
        setParticipants(prev => {
          return prev.map(p => {
            if (p.id === from) {
              return { ...p, displayName };
            }
            return p;
          });
        });
      }
      
      await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await peerConnection.createAnswer();
      
      await peerConnection.setLocalDescription(answer);
      
      // Prioritize user context for display name
      const myDisplayName = user?.name || localStorage.getItem('displayName') || 'Anonymous';
      
      if (socket) {
        console.log(`Sending answer to ${from} with display name: ${myDisplayName}`);
        socket.emit('answer', { 
          target: from, 
          answer,
          displayName: myDisplayName
        });
      }
    } catch (error) {
      console.error('Error handling offer:', error);
    }
  }, [participants, socket, createPeerConnection, user]);

  const handleAnswer = useCallback(async ({ from, answer, displayName }) => {
    console.log(`Received answer from: ${from}${displayName ? ` (${displayName})` : ''}`);
    
    try {
      const peerConnection = peerConnections.current[from];
      
      if (!peerConnection) {
        console.error(`No peer connection found for ${from}`);
        return;
      }
      
      if (displayName) {
        console.log(`Updating participant ${from} name to "${displayName}" from answer`);
        setParticipants(prev => {
          const existingParticipant = prev.find(p => p.id === from);
          
          if (!existingParticipant) {
            return [...prev, { 
              id: from, 
              displayName: displayName,
              hasStream: false
            }];
          }
          
          return prev.map(p => {
            if (p.id === from) {
              return { ...p, displayName };
            }
            return p;
          });
        });
      }
      
      await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
    } catch (error) {
      console.error('Error handling answer:', error);
    }
  }, []);

  const handleIceCandidate = useCallback(async ({ from, candidate, displayName }) => {
    try {
      const peerConnection = peerConnections.current[from];
      
      if (!peerConnection) {
        console.error(`No peer connection found for ${from}`);
        return;
      }
      
      if (displayName) {
        console.log(`Updating participant ${from} name to "${displayName}" from ICE candidate`);
        setParticipants(prev => {
          const existingParticipant = prev.find(p => p.id === from);
          
          if (!existingParticipant) {
            return [...prev, { 
              id: from, 
              displayName: displayName,
              hasStream: false
            }];
          }
          
          return prev.map(p => {
            if (p.id === from) {
              return { ...p, displayName };
            }
            return p;
          });
        });
      }
      
      await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (error) {
      console.error('Error handling ICE candidate:', error);
    }
  }, []);

  const handleChatMessage = useCallback((message) => {
    const senderId = message.userId || message.from || (message.sender && message.sender.id);
    
    const senderDisplayName = 
      message.displayName || 
      (message.sender && message.sender.displayName) || 
      (participants.find(p => p.id === senderId)?.displayName) || 
      'Anonymous';
    
    const formattedMessage = {
      id: `${senderId || 'server'}-${Date.now()}`,
      type: 'chat',
      text: message.text || message.message,
      timestamp: message.timestamp || Date.now(),
      sender: {
        id: senderId,
        displayName: senderDisplayName
      }
    };
    
    console.log('Chat message received:', { 
      original: message, 
      formatted: formattedMessage 
    });
    
    setMessages(prev => [...prev, formattedMessage]);
  }, [participants]);

  const handleSystemMessage = useCallback((message) => {
    addSystemMessage(message.text);
  }, [addSystemMessage]);

  const handleDisconnect = useCallback(() => {
    console.log('Disconnected from server');
    addNotification('Disconnected from server. Attempting to reconnect...', 'warning');
    
    setParticipants(prev => 
      prev.map(p => ({ ...p, potentiallyDisconnected: true }))
    );

  }, [addNotification]);

  const handleReconnect = useCallback(() => {
    console.log('Reconnected to server');
    addNotification('Reconnected to server', 'success');
    
    setParticipants(prev => 
      prev.map(p => {
        const { potentiallyDisconnected, ...rest } = p;
        return rest;
      })
    );
    
    if (roomId) {
      console.log(`Attempting to rejoin room ${roomId} after reconnection`);
      
      const savedSessionId = sessionStorage.getItem('rtc_session_id');
      const savedUserId = sessionStorage.getItem('rtc_user_id');
      const displayName = localStorage.getItem('displayName') || 'Anonymous';
      
      socket.emit('rejoin-room', { 
        roomId, 
        sessionId: savedSessionId,
        userId: savedUserId || socket.id,
        displayName
      });
    }
  }, [socket, roomId, addNotification]);
  
  useEffect(() => {
    if (!isAuthenticated) {
      console.log('Not authenticated, skipping socket initialization');
      return;
    }

    if (socket && socket.connected) {
      console.log('Socket already connected, skipping initialization');
      return;
    }

    try {
      startLoading('Connecting to server...');
      
      const savedName = user?.name || localStorage.getItem('displayName');
      
      const newSocket = io('http://localhost:3001', {
        withCredentials: true,
        extraHeaders: {
          "my-custom-header": "abcd"
        },
        auth: {
          displayName: savedName || 'Anonymous',
          token: token
        }
      });
      
      window.socket = newSocket;
      
      console.log(`Socket initialized with display name: ${savedName || 'Anonymous'}`);
      setSocket(newSocket);
      
      newSocket.on('connect', () => {
        stopLoading();
        addNotification('Connected to server', 'success');
        
        const savedSessionId = sessionStorage.getItem('rtc_session_id');
        const savedRoomId = sessionStorage.getItem('rtc_room_id');
        const isCreator = sessionStorage.getItem('rtc_room_creator') === 'true';
        
        if (savedSessionId) {
          newSocket.emit('restore-session', { 
            sessionId: savedSessionId,
            userId: newSocket.id,
            displayName: savedName || 'Anonymous'
          });
          
          if (savedRoomId && savedRoomId !== '') {
            console.log(`Attempting to rejoin saved room: ${savedRoomId}`);
            setRoomId(savedRoomId);
            
            if (isCreator) {
              console.log('Restoring room creator status');
              setIsRoomCreator(true);
            }
          }
        } else {
          newSocket.emit('restore-session', {
            displayName: savedName || 'Anonymous'
          });
        }
      });
      
      newSocket.on('session-restored', (data) => {
        console.log('Session restored:', data);
        
        if (data.sessionId) {
          sessionStorage.setItem('rtc_session_id', data.sessionId);
        }
        
        if (data.userId) {
          sessionStorage.setItem('rtc_user_id', data.userId);
        }
        
        if (data.roomId) {
          setRoomId(data.roomId);
          setIsRoomCreator(data.isRoomCreator || false);
          
          sessionStorage.setItem('rtc_room_id', data.roomId);
          
          if (data.isRoomCreator) {
            sessionStorage.setItem('rtc_room_creator', 'true');
          }
          
          const savedName = localStorage.getItem('displayName');
          console.log(`Rejoining room after session restore: ${data.roomId} with name ${savedName || 'Anonymous'}`);

          if (data.isRoomCreator) {
            console.log('Rejoining as room creator');
            newSocket.emit('create-room', {
              roomId: data.roomId,
              reconnect: true,
              userId: data.userId,
              displayName: savedName || 'Anonymous'
            });
          } else {
            newSocket.emit('join-room', { 
              roomId: data.roomId, 
              rejoin: true,
              userId: data.userId,
              displayName: savedName || 'Anonymous' 
            });
          }
        }
      });
      
      newSocket.on('session-created', (data) => {
        console.log('New session created:', data);
        
        if (data.sessionId) {
          sessionStorage.setItem('rtc_session_id', data.sessionId);
        }
        
        if (data.userId) {
          sessionStorage.setItem('rtc_user_id', data.userId);
        }
      });
      
      newSocket.on('connect_error', (error) => {
        stopLoading();
        setAppError(
          ERROR_TYPES.SERVER_CONNECTION,
          'Failed to connect to server',
          error.message
        );
      });
      
      return () => {
        newSocket.disconnect();
        window.socket = null;
      };
    } catch (error) {
      stopLoading();
      setAppError(
        ERROR_TYPES.SERVER_CONNECTION,
        'Failed to establish server connection',
        error.message
      );
    }
  }, [startLoading, stopLoading, setAppError, addNotification, isAuthenticated, token, user]);
    const handleUserUpdated = useCallback(({ userId, displayName }) => {
    console.log(`User updated: ${userId} (${displayName || 'Unknown'})`);
    
    setParticipants(prev => {
      const existingParticipant = prev.find(p => p.id === userId);
      
      if (!existingParticipant) {
        console.log(`User ${userId} not found, adding with name "${displayName || 'Anonymous'}"`);
        return [...prev, { 
          id: userId, 
          displayName: displayName || 'Anonymous'
        }];
      }
      
      if (displayName && existingParticipant.displayName !== displayName) {
        console.log(`Updating participant ${userId} name from "${existingParticipant.displayName}" to "${displayName}"`);
        return prev.map(p => 
          p.id === userId ? { ...p, displayName } : p
        );
      }
      
      return prev;
    });
  }, []);
  useEffect(() => {
    if (!socket) return;
    
    socket.on('room-created', handleRoomCreated);
    socket.on('room-joined', handleRoomJoined);
    socket.on('user-joined', handleUserJoined);
    socket.on('user-updated', handleUserUpdated);
    socket.on('user-left', handleUserLeft);
    socket.on('user-ready', handleUserReady);
    socket.on('user-inactive', handleUserInactive);
    socket.on('user-rejoined', handleUserRejoined);
    socket.on('room-error', handleRoomError);
    socket.on('error', handleSocketError);
    
    socket.on('offer', handleOffer);
    socket.on('answer', handleAnswer);
    socket.on('ice-candidate', handleIceCandidate);

    socket.on('chat-message', handleChatMessage);
    socket.on('system-message', handleSystemMessage);
    
    socket.on('disconnect', handleDisconnect);
    socket.on('reconnect', handleReconnect);
    
    return () => {
      socket.off('room-created');
      socket.off('room-joined');
      socket.off('user-joined');
      socket.off('user-updated');
      socket.off('user-left');
      socket.off('user-ready');
      socket.off('user-inactive');
      socket.off('user-rejoined');
      socket.off('room-error');
      socket.off('error');
      socket.off('offer');
      socket.off('answer');
      socket.off('ice-candidate');
      socket.off('chat-message');
      socket.off('system-message');
      socket.off('disconnect');
      socket.off('reconnect');
    };
  }, [socket, handleRoomCreated, handleRoomJoined, handleUserJoined, handleUserUpdated,
      handleUserLeft, handleUserReady, handleUserInactive, handleUserRejoined, 
      handleRoomError, handleSocketError, handleOffer, handleAnswer, handleIceCandidate, 
      handleChatMessage, handleSystemMessage, handleDisconnect, handleReconnect]);
  
  const startMediaStream = async (constraints = { video: true, audio: true }) => {
    try {
      if (localStream) {
        localStream.getTracks().forEach(track => {
          track.stop();
        });
      }
      
      startLoading('Accessing camera and microphone...');
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setLocalStream(stream);
      
      setIsVideoEnabled(stream.getVideoTracks().length > 0 ? 
        stream.getVideoTracks()[0].enabled : false);
      setIsAudioEnabled(stream.getAudioTracks().length > 0 ? 
        stream.getAudioTracks()[0].enabled : false);
      
      stopLoading();
      addNotification('Camera and microphone connected', 'success');
      
      return stream;
    } catch (error) {
      stopLoading();
      
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        setAppError(
          ERROR_TYPES.MEDIA_ACCESS,
          'Permission to access camera or microphone was denied',
          error.message
        );
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        setAppError(
          ERROR_TYPES.MEDIA_ACCESS,
          'No camera or microphone found',
          error.message
        );
      } else {
        setAppError(
          ERROR_TYPES.MEDIA_ACCESS,
          'Error accessing camera or microphone',
          error.message
        );
      }
      
      throw error;
    }
  };
  
  const toggleVideo = () => {
    if (!localStream) return;
    
    const videoTracks = localStream.getVideoTracks();
    if (videoTracks.length > 0) {
      const newState = !isVideoEnabled;
      videoTracks[0].enabled = newState;
      setIsVideoEnabled(newState);
    }
  };
  
  const toggleAudio = () => {
    if (!localStream) return;
    
    const audioTracks = localStream.getAudioTracks();
    if (audioTracks.length > 0) {
      const newState = !isAudioEnabled;
      audioTracks[0].enabled = newState;
      setIsAudioEnabled(newState);
    }
  };
  
  const startScreenSharing = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          cursor: 'always',
          displaySurface: 'monitor'
        }
      });
      
      screenStream.current = stream;
      setIsScreenSharing(true);
      
      const videoTrack = stream.getVideoTracks()[0];
      
      Object.values(peerConnections.current).forEach(pc => {
        const sender = pc.getSenders().find(s => 
          s.track && s.track.kind === 'video'
        );
        
        if (sender) {
          sender.replaceTrack(videoTrack);
        }
      });
      
      videoTrack.onended = () => {
        stopScreenSharing();
      };
      
      return stream;
    } catch (error) {
      console.error('Error starting screen sharing:', error);
      setIsScreenSharing(false);
      throw error;
    }
  };
  
  const stopScreenSharing = () => {
    if (!screenStream.current) return;
    
    screenStream.current.getTracks().forEach(track => track.stop());
    
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      
      if (videoTrack) {
        Object.values(peerConnections.current).forEach(pc => {
          const sender = pc.getSenders().find(s => 
            s.track && s.track.kind === 'video'
          );
          
          if (sender) {
            sender.replaceTrack(videoTrack);
          }
        });
      }
    }
    
    screenStream.current = null;
    setIsScreenSharing(false);
  };  
  const createRoom = (options = {}) => {
    if (!socket) return;
    
    // Check if user is an instructor
    if (user && user.role !== 'instructor') {
      addNotification('Only instructors can create rooms', 'error');
      return;
    }
    
    const { password, displayName } = options;
    
    const normalizedName = normalizeDisplayName(displayName);
    socket.auth = { ...socket.auth, displayName: normalizedName };
    
    console.log(`Creating room with display name: ${normalizedName}`);
    startLoading('Creating room...');
    socket.emit('create-room', { 
      password,
      displayName: normalizedName 
    });
  };
  
  const joinRoom = (options = {}) => {
    if (!socket) {
      console.error('Cannot join room: Socket not initialized');
      setAppError(
        ERROR_TYPES.SERVER_CONNECTION,
        'Cannot join room',
        'Socket connection not established. Please try again.'
      );
      stopLoading();
      return;
    }
    
    // Check if user is an instructor - instructors cannot join rooms
    if (user && user.role === 'instructor') {
      setAppError(
        ERROR_TYPES.ROOM_CONNECTION,
        'Cannot join room',
        'Instructors cannot join rooms. Please create a room instead.'
      );
      stopLoading();
      return;
    }
    
    const { roomId, password, displayName } = options;
    
    const normalizedName = normalizeDisplayName(displayName);
    socket.auth = { ...socket.auth, displayName: normalizedName };
    
    const isCreator = sessionStorage.getItem('rtc_room_creator') === 'true';
    const savedRoomId = sessionStorage.getItem('rtc_room_id');
    const isRejoiningAsCreator = isCreator && savedRoomId === roomId;
    
    console.log(`Joining room ${roomId} with display name: ${normalizedName}${isRejoiningAsCreator ? ' (as creator)' : ''}`);
    startLoading(`Joining room ${roomId}...`);
    
    const joinTimeout = setTimeout(() => {
      console.error(`Join room timeout for room ${roomId}`);
      stopLoading();

    }, 10000);
    
    socket.joinRoomTimeout = joinTimeout;
    
    if (isRejoiningAsCreator) {
      socket.emit('create-room', { 
        roomId,
        password,
        reconnect: true,
        displayName: normalizedName,
            userId: socket.id
      });
    } else {
      socket.emit('join-room', { 
        roomId, 
        password,
        displayName: normalizedName 
      });
    }
  };
  
  const leaveRoom = () => {
    if (!socket) return;
    
    socket.emit('leave-room');
    
    sessionStorage.removeItem('rtc_room_id');
    sessionStorage.removeItem('rtc_room_creator');
    
    Object.values(peerConnections.current).forEach(pc => pc.close());
    peerConnections.current = {};
    
    Object.values(dataChannels.current).forEach(dc => dc.close());
    dataChannels.current = {};
    
    setRoomId('');
    setIsRoomCreator(false);
    setParticipants([]);
    setMessages([]);
    
    if (isScreenSharing) {
      stopScreenSharing();
    }
  };
  
  const sendChatMessage = (text) => {
    if (!socket || !text.trim()) return;
    
    // Prioritize user context for display name, fall back to localStorage
    const displayName = user?.name || localStorage.getItem('displayName') || 'Anonymous';
    
    socket.emit('chat-message', { 
      message: text.trim(),
      displayName: displayName
    });
  };
  
  const toggleChat = () => {
    setIsChatOpen(prev => !prev);
  };
  
  const readyForConnections = () => {
    if (!socket || !roomId) return;
    
    // Get display name from user context if available
    const displayName = user?.name || localStorage.getItem('displayName') || 'Anonymous';
    console.log(`Sending ready signal with display name: "${displayName}"`);
    
    socket.emit('ready', { 
      roomId,
      displayName
    });
  };

  const updateParticipantStream = useCallback((userId, stream, displayName) => {  
    const normalizedName = displayName && displayName !== 'Anonymous' ? displayName : null;
    console.log(`Updating stream for participant ${userId}${normalizedName ? ` with name "${normalizedName}"` : ''}`);
    
    setParticipants(prev => {
      const existingParticipant = prev.find(p => p.id === userId);
      
      if (!existingParticipant) {
        console.log(`Participant ${userId} not found, adding with stream${normalizedName ? ` and name "${normalizedName}"` : ''}`);
        return [...prev, {
          id: userId,
          displayName: normalizedName || 'Anonymous',
          stream,
          hasVideo: stream.getVideoTracks().length > 0,
          hasAudio: stream.getAudioTracks().length > 0
        }];
      }
      
      const nameToUse = normalizedName || existingParticipant.displayName;
      console.log(`Updating participant ${userId} with stream, using name "${nameToUse}"`);
      
      return prev.map(p => {
        if (p.id === userId) {
          return {
            ...p,
            displayName: nameToUse,
            stream,
            hasVideo: stream.getVideoTracks().length > 0,
            hasAudio: stream.getAudioTracks().length > 0
          };
        }
        return p;
      });
    });
  }, []);

  const handleRemoteTrack = useCallback((event, userId, displayName) => {
    const normalizedName = normalizeDisplayName(displayName);
    console.log(`Received remote track from ${userId} (${normalizedName})`);
    
    const stream = event.streams[0];
    if (!stream) {
      console.warn(`No stream in track event from ${userId}`);
      return;
    }
    
    updateParticipantStream(userId, stream, normalizedName);
  }, [updateParticipantStream]);

  // Add this function to send attention data to the server
  const sendAttentionData = (data) => {
    if (!socket || !roomId) {
      console.warn('Cannot send attention data - socket or roomId missing');
      return;
    }
    
    // Handle both the old format (direct data object) and new format (with roomId field)
    const roomIdToSend = data.roomId || roomId;
    const attentionData = data.attentionData || data;
    
    // Make sure we have data to send
    if (!attentionData || Object.keys(attentionData).length === 0) {
      console.warn('No attention data to send');
      return;
    }
    
    // Send to server
    try {
      socket.emit('attention-data', { 
        roomId: roomIdToSend,
        attentionData: attentionData
      });
      
      console.log(`Sent attention data to server for room ${roomIdToSend}`);
    } catch (error) {
      console.error('Error sending attention data to server:', error);
    }
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        roomId,
        isRoomCreator,
        localStream,
        participants,
        messages,
        isVideoEnabled,
        isAudioEnabled,
        isScreenSharing,
        isChatOpen,
        dataChannels: dataChannels.current,
          
        createRoom,
        joinRoom,
        leaveRoom,
        restoreRoom,
        startMediaStream,
        toggleVideo,
        toggleAudio,
        startScreenSharing,
        stopScreenSharing,
        sendChatMessage,
        toggleChat,
        readyForConnections,
        registerAttentionHandler,
        unregisterAttentionHandler,
        sendAttentionData
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export default SocketContextProvider; 