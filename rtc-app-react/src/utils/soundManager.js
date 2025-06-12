/**
 * Sound Manager Utility
 * Handles loading, playing, and managing audio notifications with error resilience
 */

// Default sound URL paths
const SOUND_PATHS = {
  info: '/sounds/info.mp3',
  success: '/sounds/success.mp3',
  warning: '/sounds/warning.mp3',
  danger: '/sounds/alert.mp3',
  default: '/sounds/notification.mp3'
};

// Sound fallback priorities (if a specific sound fails to load)
const FALLBACK_ORDER = ['default', 'info', 'warning', 'success', 'danger'];

// Cache for preloaded audio elements
let audioCache = {};
let audioLoaded = {};
let masterEnabled = true;

/**
 * Initialize the sound manager and preload sounds
 * @returns {Promise} Promise that resolves when sounds are loaded or fails gracefully
 */
export const initSounds = async () => {
  try {
    // Check if sounds are enabled in localStorage
    const savedPref = localStorage.getItem('alertSoundEnabled');
    masterEnabled = savedPref === null ? true : (savedPref === 'true');
    
    // Try to create audio elements for all sounds
    const loadPromises = Object.entries(SOUND_PATHS).map(([key, path]) => {
      return new Promise((resolve) => {
        const audio = new Audio();
        
        // Handle successful load
        audio.addEventListener('canplaythrough', () => {
          audioLoaded[key] = true;
          console.log(`Sound loaded: ${key}`);
          resolve(true);
        });
        
        // Handle failed load
        audio.addEventListener('error', () => {
          console.warn(`Failed to load sound: ${key}`);
          resolve(false);
        });
        
        // Start loading
        audio.src = path;
        audio.load();
        audioCache[key] = audio;
      });
    });
    
    // Wait for all sounds to attempt loading
    await Promise.allSettled(loadPromises);
    
    console.log('Sound manager initialized');
    return true;
  } catch (error) {
    console.error('Error initializing sound manager:', error);
    return false;
  }
};

/**
 * Play a notification sound with fallbacks if the requested sound fails
 * @param {string} type - Sound type to play (info, success, warning, danger, default)
 * @returns {Promise} Promise that resolves when sound plays or fails gracefully
 */
export const playSound = async (type = 'default') => {
  if (!masterEnabled) return false;
  
  try {
    // If audio not initialized, try to initialize
    if (Object.keys(audioCache).length === 0) {
      await initSounds();
    }
    
    // Try to play the requested sound first
    if (audioLoaded[type] && audioCache[type]) {
      const audio = audioCache[type];
      audio.currentTime = 0;
      
      try {
        await audio.play();
        return true;
      } catch (error) {
        console.warn(`Error playing ${type} sound:`, error);
      }
    }
    
    // If requested sound failed, try fallbacks in order
    for (const fallbackType of FALLBACK_ORDER) {
      if (fallbackType !== type && audioLoaded[fallbackType] && audioCache[fallbackType]) {
        try {
          const fallbackAudio = audioCache[fallbackType];
          fallbackAudio.currentTime = 0;
          await fallbackAudio.play();
          return true;
        } catch (error) {
          console.warn(`Fallback sound ${fallbackType} also failed:`, error);
        }
      }
    }
    
    // All attempts failed
    return false;
  } catch (error) {
    console.error('Error in playSound:', error);
    return false;
  }
};

/**
 * Enable or disable all sounds
 * @param {boolean} enabled - Whether sounds should be enabled
 */
export const setSoundEnabled = (enabled) => {
  try {
    masterEnabled = enabled;
    localStorage.setItem('alertSoundEnabled', enabled.toString());
  } catch (error) {
    console.error('Error setting sound preference:', error);
  }
};

/**
 * Check if sounds are currently enabled
 * @returns {boolean} Whether sounds are enabled
 */
export const isSoundEnabled = () => {
  return masterEnabled;
};

/**
 * Clean up sound resources
 */
export const cleanupSounds = () => {
  try {
    Object.values(audioCache).forEach(audio => {
      if (audio) {
        audio.pause();
        audio.src = '';
      }
    });
    audioCache = {};
    audioLoaded = {};
  } catch (error) {
    console.error('Error cleaning up sounds:', error);
  }
};

// Initialize sounds when module is imported
initSounds().catch(console.error);

export default {
  playSound,
  setSoundEnabled,
  isSoundEnabled,
  initSounds,
  cleanupSounds
}; 