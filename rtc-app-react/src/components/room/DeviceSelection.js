import React, { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faVideo } from '@fortawesome/free-solid-svg-icons';
import { SocketContext } from '../../context/SocketContext';

const DeviceSelection = () => {
  const [videoDevices, setVideoDevices] = useState([]);
  const [audioDevices, setAudioDevices] = useState([]);
  const [audioOutputDevices, setAudioOutputDevices] = useState([]);
  const [selectedVideoDevice, setSelectedVideoDevice] = useState('');
  const [selectedAudioDevice, setSelectedAudioDevice] = useState('');
  const [selectedAudioOutput, setSelectedAudioOutput] = useState('');
  const [previewStream, setPreviewStream] = useState(null);
  
  const videoPreviewRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  
  const { 
    startMediaStream,
    roomId,
    readyForConnections
  } = useContext(SocketContext);
  const navigate = useNavigate();
  
  const [returningToRoom, setReturningToRoom] = useState(false);
  const [returnRoomId, setReturnRoomId] = useState('');
  
  useEffect(() => {
    const savedRoomId = sessionStorage.getItem('returnToRoom');
    if (savedRoomId) {
      setReturningToRoom(true);
      setReturnRoomId(savedRoomId);
      sessionStorage.removeItem('returnToRoom');
    }
  }, []);
  
  useEffect(() => {
    const loadDevices = async () => {
      try {
        await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        
        const devices = await navigator.mediaDevices.enumerateDevices();
        
        const videoInputs = devices.filter(device => device.kind === 'videoinput');
        const audioInputs = devices.filter(device => device.kind === 'audioinput');
        const audioOutputs = devices.filter(device => device.kind === 'audiooutput');
        
        setVideoDevices(videoInputs);
        setAudioDevices(audioInputs);
        setAudioOutputDevices(audioOutputs);
        
        if (videoInputs.length > 0) {
          setSelectedVideoDevice(videoInputs[0].deviceId);
        }
        if (audioInputs.length > 0) {
          setSelectedAudioDevice(audioInputs[0].deviceId);
        }
        if (audioOutputs.length > 0) {
          setSelectedAudioOutput(audioOutputs[0].deviceId);
        }
      } catch (error) {
        console.error('Error loading devices:', error);
      }
    };
    
    loadDevices();
    
    return () => {
      if (previewStream) {
        previewStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);
  
  useEffect(() => {
    const startPreview = async () => {
      try {
        if (previewStream) {
          previewStream.getTracks().forEach(track => track.stop());
        }
        
        if (!selectedVideoDevice && !selectedAudioDevice) return;
        
        const constraints = {
          video: selectedVideoDevice ? { deviceId: { exact: selectedVideoDevice } } : false,
          audio: selectedAudioDevice ? { deviceId: { exact: selectedAudioDevice } } : false
        };
        
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        setPreviewStream(stream);
        
        if (videoPreviewRef.current) {
          videoPreviewRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error starting preview:', error);
      }
    };
    
    startPreview();
  }, [selectedVideoDevice, selectedAudioDevice]);
  
  useEffect(() => {
    if (videoPreviewRef.current && selectedAudioOutput && 
        typeof videoPreviewRef.current.setSinkId === 'function') {
      videoPreviewRef.current.setSinkId(selectedAudioOutput)
        .catch(error => console.error('Error setting audio output:', error));
    }
  }, [selectedAudioOutput]);
  
  useEffect(() => {
    if (!roomId) {
      navigate('/');
    }
  }, [roomId, navigate]);
  
  useEffect(() => {
    if (videoRef.current && previewStream) {
      videoRef.current.srcObject = previewStream;
    }
    
    return () => {
      if (previewStream) {
        previewStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [videoRef, previewStream]);
  
  useEffect(() => {
    if (canvasRef.current && videoRef.current && previewStream) {
      const interval = setInterval(() => {
        if (canvasRef.current && videoRef.current) {
          const canvas = canvasRef.current;
          const video = videoRef.current;
          const ctx = canvas.getContext('2d');
          
          canvas.width = video.videoWidth || 320;
          canvas.height = video.videoHeight || 240;
          
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        }
      }, 200);
      
      return () => clearInterval(interval);
    }
  }, [canvasRef, videoRef, previewStream]);
  
  const handleJoinClass = async () => {
    try {
      if (previewStream) {
        previewStream.getTracks().forEach(track => track.stop());
      }
      
      const constraints = {
        video: selectedVideoDevice ? { deviceId: { exact: selectedVideoDevice } } : false,
        audio: selectedAudioDevice ? { deviceId: { exact: selectedAudioDevice } } : false
      };
      
      await startMediaStream(constraints);
      
      readyForConnections();
      
      const targetRoomId = returningToRoom ? returnRoomId : roomId;
      navigate(`/room/${targetRoomId}`);
    } catch (error) {
      console.error('Error starting media stream:', error);
      alert(`Could not access camera/microphone: ${error.message}`);
    }
  };
  
  return (
    <div className="d-flex flex-column justify-content-center align-items-center vh-100" style={{ backgroundColor: '#323248' }}>
      <div className="card shadow rounded-4 p-4" style={{ maxWidth: '600px', backgroundColor: '#252536', color: '#e0e0e0', border: '1px solid #454564' }}>
        <div className="card-body">
          <h2 className="card-title text-center mb-4">Setup Your Devices</h2>
          
          <div className="video-preview-container mb-4">
            <video 
              ref={videoPreviewRef}
              autoPlay 
              playsInline 
              muted 
              className="rounded w-100"
              style={{ aspectRatio: '16/9', backgroundColor: 'rgba(37, 37, 54, 0.5)' }}
            />
          </div>
          
          <div className="mb-3">
            <label htmlFor="video-source" className="form-label">Camera</label>
            <select 
              id="video-source" 
              className="form-select border-0"
              style={{ backgroundColor: '#323248', color: '#e0e0e0', borderColor: '#454564' }}
              value={selectedVideoDevice}
              onChange={(e) => setSelectedVideoDevice(e.target.value)}
            >
              {videoDevices.map((device, index) => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label || `Camera ${index + 1}`}
                </option>
              ))}
            </select>
          </div>
          
          <div className="mb-3">
            <label htmlFor="audio-source" className="form-label">Microphone</label>
            <select 
              id="audio-source" 
              className="form-select border-0"
              style={{ backgroundColor: '#323248', color: '#e0e0e0', borderColor: '#454564' }}
              value={selectedAudioDevice}
              onChange={(e) => setSelectedAudioDevice(e.target.value)}
            >
              {audioDevices.map((device, index) => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label || `Microphone ${index + 1}`}
                </option>
              ))}
            </select>
          </div>
          
          <div className="mb-4">
            <label htmlFor="audio-output" className="form-label">Speaker</label>
            <select 
              id="audio-output" 
              className="form-select border-0"
              style={{ backgroundColor: '#323248', color: '#e0e0e0', borderColor: '#454564' }}
              value={selectedAudioOutput}
              onChange={(e) => setSelectedAudioOutput(e.target.value)}
              disabled={typeof HTMLMediaElement.prototype.setSinkId !== 'function'}
            >
              {audioOutputDevices.map((device, index) => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label || `Speaker ${index + 1}`}
                </option>
              ))}
            </select>
            {typeof HTMLMediaElement.prototype.setSinkId !== 'function' && (
              <small className="text-muted">
                Your browser doesn't support audio output selection
              </small>
            )}
          </div>
          
          <div className="d-grid">
            <button 
              className="btn btn-lg"
              style={{ backgroundColor: '#3949AB', color: '#ffffff' }}
              onClick={handleJoinClass}
            >
              <FontAwesomeIcon icon={faVideo} className="me-2" />
              {returningToRoom ? 'Return to Class' : 'Join Class'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeviceSelection; 