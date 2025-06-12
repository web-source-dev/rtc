
const SOUND_PATHS = {
  info: '/sounds/info.mp3',
  success: '/sounds/success.mp3',
  warning: '/sounds/warning.mp3',
  danger: '/sounds/alert.mp3',
  default: '/sounds/notification.mp3'
};

const FALLBACK_ORDER = ['default', 'info', 'warning', 'success', 'danger'];

let audioCache = {};
let audioLoaded = {};
let masterEnabled = true;

export const initSounds = async () => {
  try {
    const savedPref = localStorage.getItem('alertSoundEnabled');
    masterEnabled = savedPref === null ? true : (savedPref === 'true');
    
    const loadPromises = Object.entries(SOUND_PATHS).map(([key, path]) => {
      return new Promise((resolve) => {
        const audio = new Audio();
        
        audio.addEventListener('canplaythrough', () => {
          audioLoaded[key] = true;
          console.log(`Sound loaded: ${key}`);
          resolve(true);
        });
        
        audio.addEventListener('error', () => {
          console.warn(`Failed to load sound: ${key}`);
          resolve(false);
        });
        
        audio.src = path;
        audio.load();
        audioCache[key] = audio;
      });
    });
    
    await Promise.allSettled(loadPromises);
    
    console.log('Sound manager initialized');
    return true;
  } catch (error) {
    console.error('Error initializing sound manager:', error);
    return false;
  }
};

export const playSound = async (type = 'default') => {
  if (!masterEnabled) return false;
  
  try { 
    if (Object.keys(audioCache).length === 0) {
      await initSounds();
    }
    
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
    
    return false;
  } catch (error) {
    console.error('Error in playSound:', error);
    return false;
  }
};

export const setSoundEnabled = (enabled) => {
  try {
    masterEnabled = enabled;
    localStorage.setItem('alertSoundEnabled', enabled.toString());
  } catch (error) {
    console.error('Error setting sound preference:', error);
  }
};

export const isSoundEnabled = () => {
  return masterEnabled;
};


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

initSounds().catch(console.error);

export default {
  playSound,
  setSoundEnabled,
  isSoundEnabled,
  initSounds,
  cleanupSounds
}; 