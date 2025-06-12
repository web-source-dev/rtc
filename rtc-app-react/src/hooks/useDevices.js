import { useEffect, useState, useCallback } from 'react';
import { useAppState, ERROR_TYPES } from './useAppState';

const useDevices = () => {
  const { setAppError, addNotification } = useAppState();
  const [audioInputs, setAudioInputs] = useState([]);
  const [videoInputs, setVideoInputs] = useState([]);
  const [audioOutputs, setAudioOutputs] = useState([]);
  const [selectedAudioInput, setSelectedAudioInput] = useState('');
  const [selectedVideoInput, setSelectedVideoInput] = useState('');
  const [selectedAudioOutput, setSelectedAudioOutput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  const loadDevices = useCallback(async () => {
    try {
      setIsLoading(true);
      
      let needsPermissions = true;
      
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        needsPermissions = devices.every(device => !device.label);
      } catch (e) {
        console.warn('Error checking device permissions:', e);
      }
      
      if (needsPermissions) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
          stream.getTracks().forEach(track => track.stop());
        } catch (error) {
          console.warn('Could not get full device permissions:', error);
          
          try {
            const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            audioStream.getTracks().forEach(track => track.stop());
          } catch (audioError) {
            console.warn('Could not get audio permissions either:', audioError);
          }
        }
      }
      
      const devices = await navigator.mediaDevices.enumerateDevices();
      
      const audioIn = devices.filter(device => device.kind === 'audioinput');
      const videoIn = devices.filter(device => device.kind === 'videoinput');
      const audioOut = devices.filter(device => device.kind === 'audiooutput');
      
      setAudioInputs(audioIn);
      setVideoInputs(videoIn);
      setAudioOutputs(audioOut);
      
      if (audioIn.length > 0 && !selectedAudioInput) {
        setSelectedAudioInput(audioIn[0].deviceId);
      }
      
      if (videoIn.length > 0 && !selectedVideoInput) {
        setSelectedVideoInput(videoIn[0].deviceId);
      }
      
      if (audioOut.length > 0 && !selectedAudioOutput) {
        setSelectedAudioOutput(audioOut[0].deviceId);
      }
      
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      setAppError(
        ERROR_TYPES.MEDIA_ACCESS,
        'Failed to access media devices',
        error.message
      );
    }
  }, [selectedAudioInput, selectedVideoInput, selectedAudioOutput, setAppError]);
  
  useEffect(() => {
    const handleDeviceChange = async () => {
      addNotification('Media devices changed. Updating device list...', 'info');

      const prevAudioInput = selectedAudioInput;
      const prevVideoInput = selectedVideoInput;
      const prevAudioOutput = selectedAudioOutput;
      
      await loadDevices();
      
      const audioInputExists = audioInputs.some(device => device.deviceId === prevAudioInput);
      const videoInputExists = videoInputs.some(device => device.deviceId === prevVideoInput);
      const audioOutputExists = audioOutputs.some(device => device.deviceId === prevAudioOutput);
      
      if (prevAudioInput && !audioInputExists) {
        addNotification('Selected microphone was disconnected', 'warning');
      }
      
      if (prevVideoInput && !videoInputExists) {
        addNotification('Selected camera was disconnected', 'warning');
      }
      
      if (prevAudioOutput && !audioOutputExists) {
        addNotification('Selected speaker was disconnected', 'warning');
      }
    };
    
    loadDevices();
    
    navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);
    
    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange);
    };
  }, [loadDevices, addNotification, audioInputs, videoInputs, audioOutputs, selectedAudioInput, selectedVideoInput, selectedAudioOutput]);
  
  const getConstraints = useCallback(() => {
    const constraints = {
      audio: true,
      video: true
    };
    
    if (selectedAudioInput) {
      constraints.audio = { deviceId: { exact: selectedAudioInput } };
    }
    
    if (selectedVideoInput) {
      constraints.video = { 
        deviceId: { exact: selectedVideoInput },
        width: { ideal: 1280 },
        height: { ideal: 720 }
      };
    }
    
    return constraints;
  }, [selectedAudioInput, selectedVideoInput]);
  
  const applyAudioOutput = useCallback(async (element) => {
    if (!element || !selectedAudioOutput) return;
    
    try { 
      if (typeof element.setSinkId === 'function') {
        await element.setSinkId(selectedAudioOutput);
      }
    } catch (error) {
      console.warn('Failed to set audio output device:', error);
    }
  }, [selectedAudioOutput]);
  
  return {
    audioInputs,
    videoInputs,
    audioOutputs,
    selectedAudioInput,
    selectedVideoInput,
    selectedAudioOutput,
    setSelectedAudioInput,
    setSelectedVideoInput,
    setSelectedAudioOutput,
    isLoading,
    loadDevices,
    getConstraints,
    applyAudioOutput
  };
};

export default useDevices; 