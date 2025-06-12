# Sound Files for RTC App Notifications

This directory contains audio files used for participant state change notifications.

## Sound Files

The application expects the following sound files:

- `info.mp3` - Used for informational alerts (e.g., participant looking away)
- `success.mp3` - Used for positive state changes (e.g., participant becoming active)
- `warning.mp3` - Used for warning alerts (e.g., participant becoming drowsy)
- `alert.mp3` - Used for critical alerts (e.g., participant absent or sleeping)
- `notification.mp3` - Default notification sound used as a fallback

## Participant State Alerts

The alert system notifies hosts when participants change their attention state during a class. These state changes include:

- **Critical alerts** (plays alert.mp3 sound twice):
  - Participant becomes absent
  - Participant appears to be sleeping
  
- **Warning alerts** (plays warning.mp3):
  - Participant becomes drowsy
  - Participant's attention is deteriorating
  
- **Info alerts** (plays info.mp3):
  - Participant is looking away
  - Participant's video feed is too dark
  
- **Success alerts** (plays success.mp3):
  - Participant becomes attentive after being distracted
  - Participant returns to class after being absent

Alerts will appear in the top-right corner of the screen and will automatically dismiss after 15 seconds. Hosts can access the full alert history by clicking the history button in the alert toolbar.

## How to Use Alerts

1. Alerts are enabled by default for hosts
2. Toggle alerts on/off using the bell icon in the control bar
3. Mute/unmute alert sounds using the volume icon in the alert toolbar
4. View alert history using the history icon
5. Filter alerts by type using the filter icon

## Sound Requirements

- All files should be in MP3 format for wide browser compatibility
- Files should be short (1-3 seconds) and professional in tone
- Sound files should be appropriate for classroom/educational environments
- Critical alerts (danger) should be more distinctive to draw attention

## Creating Custom Sound Files

If you want to replace the default sound files with your own:

1. Create MP3 files with the exact names listed above
2. Place them in this directory
3. Make sure they are appropriately distinct for their alert levels
4. Keep file sizes small (under 100KB) for performance

## Adding Sound Files

To add sound files:

1. Create or obtain MP3 sound files for each notification type
2. Name them according to the convention above
3. Place them in this directory

The application has a fallback system - if a specific sound file is missing, it will try to use 
alternative notification sounds in this order: default → info → warning → success → danger.

## Licensing Information

When adding sound files, ensure they are either:
- Created specifically for this project
- Licensed for commercial use
- Royalty-free
- Public domain

Please document the source and license of each sound file here if not created specifically for this project. 