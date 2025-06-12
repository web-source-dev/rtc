# WebRTC Video Conferencing Application

A real-time video conferencing application built with React and WebRTC for peer-to-peer communication.

## Features

- Real-time video/audio communication
- Text chat during video calls
- Screen sharing
- Room creation and joining
- Device selection (camera, microphone)
- Responsive design
- Accessibility features
- Connection quality monitoring
- Attention monitoring

## Project Structure

- `rtc-app-react/` - The React frontend application
- `server/` - WebSocket signaling server for WebRTC
- `attention_server/` - Python-based attention monitoring service

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- Python 3.7+ (for attention monitoring)

### Running the Application

1. Start the signaling server:
   ```
   cd server
   npm install
   node index.js
   ```

2. Start the React application:
   ```
   cd rtc-app-react
   npm install
   npm start
   ```

3. (Optional) Start the attention monitoring server:
   ```
   cd attention_server
   pip install -r requirements.txt
   python app.py
   ```

4. Open your browser and navigate to `http://localhost:3000`

## Technical Details

- Frontend: React, Socket.io client, Bootstrap
- Backend: Node.js, Express, Socket.io
- WebRTC for peer-to-peer communication
- Attention monitoring using Python

## Accessibility Features

- Keyboard navigation support
- Screen reader compatibility
- High contrast mode support
- Reduced motion support
- Focus indicators

## Responsive Design

The application is designed to work on various screen sizes, from mobile devices to desktop computers.

## Testing

Run the tests with:
```
cd rtc-app-react
npm test
```

## License

[MIT](LICENSE) 