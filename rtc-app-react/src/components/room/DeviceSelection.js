import React, { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faVideo, faCamera, faMicrophone, faVolumeUp, faSpinner } from '@fortawesome/free-solid-svg-icons';
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
    <div className="d-flex flex-column justify-content-center align-items-center min-vh-100" 
         style={{ 
           background: 'linear-gradient(135deg, #323248 0%, #252536 100%)',
           padding: '2rem 1rem'
         }}>
      <div className="card shadow-lg rounded-4 p-4 mx-auto" 
           style={{ 
             maxWidth: '800px', 
             width: '100%',
             backgroundColor: 'rgba(37, 37, 54, 0.95)', 
             color: '#e0e0e0', 
             border: '1px solid rgba(69, 69, 100, 0.5)',
             backdropFilter: 'blur(10px)'
           }}>
        <div className="card-body p-4">
          <div className="text-center mb-5">
            <h1 className="display-6 fw-bold mb-2" style={{ color: '#3949AB' }}>Setup Your Devices</h1>
            <p className="text-muted">Configure your camera and audio before joining the class</p>
          </div>
          
          <div className="row g-4">
            <div className="col-lg-7">
              <div className="video-preview-container mb-4 position-relative rounded-4 overflow-hidden"
                   style={{ 
                     backgroundColor: 'rgba(50, 50, 72, 0.5)',
                     aspectRatio: '16/9'
                   }}>
                <video 
                  ref={videoPreviewRef}
                  autoPlay 
                  playsInline 
                  muted 
                  className="w-100 h-100 object-fit-cover"
                />
                <div className="position-absolute top-0 start-0 p-3">
                  <span className="badge bg-dark bg-opacity-75">
                    <FontAwesomeIcon icon={faCamera} className="me-2" />
                    Camera Preview
                  </span>
                </div>
              </div>
              
              <div className="mb-4">
                <label htmlFor="video-source" className="form-label d-flex align-items-center">
                  <FontAwesomeIcon icon={faCamera} className="me-2" style={{ color: '#3949AB' }} />
                  Camera
                </label>
                <select 
                  id="video-source" 
                  className="form-select form-select-lg border-0"
                  style={{ 
                    backgroundColor: 'rgba(50, 50, 72, 0.5)', 
                    color: '#e0e0e0',
                    borderRadius: '8px',
                    padding: '0.75rem 1rem'
                  }}
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
              
              <div className="mb-4">
                <label htmlFor="audio-source" className="form-label d-flex align-items-center">
                  <FontAwesomeIcon icon={faMicrophone} className="me-2" style={{ color: '#3949AB' }} />
                  Microphone
                </label>
                <select 
                  id="audio-source" 
                  className="form-select form-select-lg border-0"
                  style={{ 
                    backgroundColor: 'rgba(50, 50, 72, 0.5)', 
                    color: '#e0e0e0',
                    borderRadius: '8px',
                    padding: '0.75rem 1rem'
                  }}
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
                <label htmlFor="audio-output" className="form-label d-flex align-items-center">
                  <FontAwesomeIcon icon={faVolumeUp} className="me-2" style={{ color: '#3949AB' }} />
                  Speaker
                </label>
                <select 
                  id="audio-output" 
                  className="form-select form-select-lg border-0"
                  style={{ 
                    backgroundColor: 'rgba(50, 50, 72, 0.5)', 
                    color: '#e0e0e0',
                    borderRadius: '8px',
                    padding: '0.75rem 1rem'
                  }}
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
                  <small className="text-muted mt-2 d-block">
                    Your browser doesn't support audio output selection
                  </small>
                )}
              </div>
            </div>
            
            <div className="col-lg-5 d-flex flex-column justify-content-between">
              <div className="device-tips p-4 rounded-4 mb-4" 
                   style={{ backgroundColor: 'rgba(50, 50, 72, 0.5)' }}>
                <h5 className="mb-3" style={{ color: '#3949AB' }}>Tips for Best Experience</h5>
                <ul className="list-unstyled mb-0">
                  <li className="mb-2">
                    <FontAwesomeIcon icon={faCamera} className="me-2" style={{ color: '#3949AB' }} />
                    Ensure good lighting for better video quality
                  </li>
                  <li className="mb-2">
                    <FontAwesomeIcon icon={faMicrophone} className="me-2" style={{ color: '#3949AB' }} />
                    Use a quiet environment for clear audio
                  </li>
                  <li className="mb-2">
                    <FontAwesomeIcon icon={faVolumeUp} className="me-2" style={{ color: '#3949AB' }} />
                    Test your speakers before joining
                  </li>
                </ul>
              </div>
              
              <div className="d-grid">
                <button 
                  className="btn btn-lg"
                  style={{ 
                    backgroundColor: '#3949AB', 
                    color: '#ffffff',
                    borderRadius: '8px',
                    padding: '0.75rem 1rem',
                    transition: 'all 0.3s ease'
                  }}
                  onClick={handleJoinClass}
                  onMouseOver={(e) => e.target.style.backgroundColor = '#2c3a8c'}
                  onMouseOut={(e) => e.target.style.backgroundColor = '#3949AB'}
                >
                  <FontAwesomeIcon icon={faVideo} className="me-2" />
                  {returningToRoom ? 'Return to Class' : 'Join Class'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeviceSelection; 