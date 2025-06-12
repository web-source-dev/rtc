/**
 * @param {HTMLVideoElement} videoElement 
 * @param {Object} options 
 * @param {number} options.quality 
 * @param {number} options.maxWidth 
 * @returns {string} 
 */
export const captureVideoFrame = (videoElement, options = {}) => {
  if (!videoElement || !videoElement.readyState) {
    console.warn('Video element not ready for capture');
    return null;
  }
  
  const quality = options.quality || 0.7;
  const maxWidth = options.maxWidth || 640;
  
  try {
    const canvas = document.createElement('canvas');
    const videoWidth = videoElement.videoWidth;
    const videoHeight = videoElement.videoHeight;
    
    let targetWidth = videoWidth;
    let targetHeight = videoHeight;
    
    if (targetWidth > maxWidth) {
      const scaleFactor = maxWidth / targetWidth;
      targetWidth = maxWidth;
      targetHeight = Math.floor(videoHeight * scaleFactor);
    }
    
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoElement, 0, 0, targetWidth, targetHeight);
    
    const dataUrl = canvas.toDataURL('image/jpeg', quality);
    
    return dataUrl;
  } catch (error) {
    console.error('Error capturing video frame:', error);
    return null;
  }
};

/**
 * @param {HTMLVideoElement} videoElement 
 * @param {Function} onFrameCaptured 
 * @param {Object} options 
 * @param {number} options.interval 
 * @param {number} options.quality 
 * @param {number} options.maxWidth 
 * @returns {Object} 
 */
export const setupPeriodicCapture = (videoElement, onFrameCaptured, options = {}) => {
  const interval = options.interval || 5000;
  const captureOptions = {
    quality: options.quality || 0.7,
    maxWidth: options.maxWidth || 640
  };
  
  const intervalId = setInterval(() => {
    const frameData = captureVideoFrame(videoElement, captureOptions);
    if (frameData) {
      onFrameCaptured(frameData);
    }
  }, interval);
  
  return {
    stop: () => clearInterval(intervalId),
    captureNow: () => {
      const frameData = captureVideoFrame(videoElement, captureOptions);
      if (frameData) {
        onFrameCaptured(frameData);
      }
      return frameData;
    }
  };
}; 