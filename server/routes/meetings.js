const express = require('express');
const router = express.Router();
const Meeting = require('../models/Meeting');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Middleware to check if user is an instructor
const isInstructor = async (req, res, next) => {
  try {
    if (req.user && req.user.role === 'instructor') {
      return next();
    }
    return res.status(403).json({
      success: false,
      message: 'Access denied. Only instructors can access this resource.'
    });
  } catch (error) {
    console.error('Error in isInstructor middleware:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Get all meetings for the logged in instructor
router.get('/', auth, isInstructor, async (req, res) => {
  try {
    const meetings = await Meeting.find({ creator: req.user.id })
      .sort({ startTime: -1 })
      .select('-attentionSnapshots'); // Exclude the large snapshots array

    res.status(200).json({
      success: true,
      data: meetings
    });
  } catch (error) {
    console.error('Error fetching meetings:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get a single meeting by ID
router.get('/:id', auth, isInstructor, async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id);
    
    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found'
      });
    }
    
    // Ensure the user owns this meeting
    if (meeting.creator.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    res.status(200).json({
      success: true,
      data: meeting
    });
  } catch (error) {
    console.error('Error fetching meeting:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get meeting analytics by ID
router.get('/:id/analytics', auth, isInstructor, async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id);
    
    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found'
      });
    }
    
    // Ensure the user owns this meeting
    if (meeting.creator.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Calculate meeting duration safely
    let duration = 0;
    if (meeting.startTime) {
      if (meeting.endTime) {
        // Completed meeting
        const endTime = new Date(meeting.endTime);
        const startTime = new Date(meeting.startTime);
        
        if (!isNaN(endTime.getTime()) && !isNaN(startTime.getTime())) {
          duration = Math.max(0, Math.floor((endTime - startTime) / 1000));
          
          // Cap duration to reasonable maximum (7 days)
          const MAX_DURATION = 7 * 24 * 60 * 60; // 7 days in seconds
          if (duration > MAX_DURATION) {
            console.warn(`Meeting ${meeting._id} has excessive duration: ${duration}s. Capping to ${MAX_DURATION}s`);
            duration = MAX_DURATION;
          }
        }
      } else {
        // Ongoing meeting
        const now = new Date();
        const startTime = new Date(meeting.startTime);
        
        if (!isNaN(startTime.getTime())) {
          duration = Math.max(0, Math.floor((now - startTime) / 1000));
          
          // Cap duration to reasonable maximum (7 days)
          const MAX_DURATION = 7 * 24 * 60 * 60; // 7 days in seconds
          if (duration > MAX_DURATION) {
            console.warn(`Meeting ${meeting._id} has excessive duration: ${duration}s. Capping to ${MAX_DURATION}s`);
            duration = MAX_DURATION;
          }
        }
      }
    }
    
    // Initialize default attention states if missing
    const defaultStates = {
      attentive: 0,
      active: 0,
      looking_away: 0,
      drowsy: 0,
      sleeping: 0,
      absent: 0,
      darkness: 0
    };

    // Deep copy to prevent reference issues
    const attentionStates = { ...defaultStates };
    
    // Process and prepare analytics data
    const analytics = {
      overview: meeting.overallStats || {
        totalParticipants: meeting.participants.length,
        maxConcurrentParticipants: meeting.participants.length,
        averageAttention: 0,
        attentiveCount: 0,
        distractedCount: 0,
        absentCount: 0
      },
      duration: duration,
      participantCount: meeting.participants.length,
      attentionStates: attentionStates,
      participantData: [],
      timeSeriesData: processTimeSeriesData(meeting.attentionSnapshots || [])
    };
    
    // Process participant data with validation
    analytics.participantData = meeting.participants.map(p => {
      // Ensure all attention data fields exist
      const attentionData = { ...defaultStates, ...(p.attentionData || {}) };
      
      // Calculate attention percentage safely
      const attentionPercentage = calculateAttentionPercentage(attentionData);
      
      // Add to state totals
      Object.keys(attentionData).forEach(state => {
        if (analytics.attentionStates[state] !== undefined) {
          const value = attentionData[state] || 0;
          analytics.attentionStates[state] += value;
        }
      });
      
      // Calculate total time for this participant
      const totalSeconds = Object.values(attentionData).reduce((sum, val) => sum + (typeof val === 'number' ? val : 0), 0);
      
      return {
        name: p.name || 'Anonymous',
        userId: p.userId,
        joinTime: p.joinTime,
        leaveTime: p.leaveTime,
        attentionData: attentionData,
        attentionPercentage: attentionPercentage,
        totalTime: totalSeconds
      };
    });
    
    res.status(200).json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Error fetching meeting analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Helper function to calculate attention percentage
function calculateAttentionPercentage(attentionData) {
  if (!attentionData) return 0;
  
  // Validate input - ensure we have an object with numeric values
  const validData = {};
  
  // Copy only numeric values to our valid data object
  Object.keys(attentionData).forEach(key => {
    if (typeof attentionData[key] === 'number' && !isNaN(attentionData[key])) {
      validData[key] = Math.max(0, attentionData[key]); // Ensure non-negative
    } else {
      validData[key] = 0;
    }
  });
  
  const totalTime = Object.values(validData).reduce((sum, val) => sum + val, 0);
  if (totalTime === 0) return 0;
  
  const attentiveTime = (validData.attentive || 0) + (validData.active || 0);
  const percentage = (attentiveTime / totalTime) * 100;
  
  // Cap percentage at 100% and ensure it's non-negative
  return Math.min(100, Math.max(0, percentage));
}

// Helper function to process time series data for charts
function processTimeSeriesData(snapshots) {
  if (!snapshots || !Array.isArray(snapshots) || snapshots.length === 0) return [];
  
  // Group snapshots by timestamp (rounded to nearest minute)
  const groupedByTime = {};
  
  // Set a limit to prevent processing too many snapshots
  const MAX_SNAPSHOTS = 5000;
  const snapshotsToProcess = snapshots.slice(-MAX_SNAPSHOTS);
  
  console.log(`Processing ${snapshotsToProcess.length} snapshots for time series data (of ${snapshots.length} total)`);
  
  // States we'll track
  const validStates = [
    'attentive', 'active', 'looking_away', 'drowsy', 'sleeping', 'absent', 'darkness'
  ];
  
  snapshotsToProcess.forEach(snapshot => {
    try {
      // Skip invalid snapshots
      if (!snapshot || !snapshot.timestamp) return;
      
      let timestamp;
      try {
        timestamp = new Date(snapshot.timestamp);
        if (isNaN(timestamp.getTime())) {
          console.warn('Invalid timestamp in snapshot:', snapshot.timestamp);
          return;
        }
      } catch (e) {
        console.warn('Error parsing timestamp:', e);
        return;
      }
      
      // Round to minute to reduce data points
      timestamp.setSeconds(0, 0);
      const timeKey = timestamp.toISOString();
      
      if (!groupedByTime[timeKey]) {
        // Initialize with all states at 0
        const newPoint = { timestamp: timeKey, total: 0 };
        validStates.forEach(state => {
          newPoint[state] = 0;
        });
        groupedByTime[timeKey] = newPoint;
      }
      
      // Normalize the state
      const state = snapshot.attentionState || 'unknown';
      
      // Only count known states
      if (validStates.includes(state)) {
        groupedByTime[timeKey][state] += 1;
        groupedByTime[timeKey].total += 1;
      }
    } catch (error) {
      console.warn('Error processing snapshot:', error);
      // Continue processing other snapshots
    }
  });
  
  // Convert to array and sort by timestamp
  const sortedData = Object.values(groupedByTime)
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  
  // Convert counts to percentages
  return sortedData.map(point => {
    const result = { timestamp: point.timestamp };
    
    if (point.total > 0) {
      validStates.forEach(state => {
        result[state] = Math.min(100, Math.max(0, (point[state] / point.total) * 100));
      });
    } else {
      // If no data, set all states to 0
      validStates.forEach(state => {
        result[state] = 0;
      });
    }
    
    return result;
  });
}

module.exports = router; 