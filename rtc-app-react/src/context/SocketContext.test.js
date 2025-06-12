import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SocketContextProvider, SocketContext } from './SocketContext';
import { AppStateProvider } from './AppStateContext';

jest.mock('socket.io-client', () => {
  const mockSocket = {
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
    disconnect: jest.fn(),
  };
  return {
    io: jest.fn(() => mockSocket),
  };
});

global.navigator.mediaDevices = {
  getUserMedia: jest.fn().mockImplementation(() => 
    Promise.resolve({
      getTracks: () => [
        { kind: 'video', enabled: true },
        { kind: 'audio', enabled: true }
      ],
      getVideoTracks: () => [{ enabled: true }],
      getAudioTracks: () => [{ enabled: true }]
    })
  ),
  getDisplayMedia: jest.fn().mockImplementation(() => 
    Promise.resolve({
      getTracks: () => [{ kind: 'video', enabled: true }],
      getVideoTracks: () => [{ enabled: true, onended: null }]
    })
  )
};

const TestComponent = () => {
  const {
    roomId,
    isRoomCreator,
    participants,
    localStream,
    isVideoEnabled,
    isAudioEnabled,
    createRoom,
    joinRoom
  } = React.useContext(SocketContext);

  return (
    <div>
      <div data-testid="room-id">{roomId}</div>
      <div data-testid="is-creator">{isRoomCreator.toString()}</div>
      <div data-testid="participants">{participants.length}</div>
      <div data-testid="has-local-stream">{Boolean(localStream).toString()}</div>
      <div data-testid="video-enabled">{isVideoEnabled.toString()}</div>
      <div data-testid="audio-enabled">{isAudioEnabled.toString()}</div>
      <button onClick={() => createRoom()}>Create Room</button>
      <button onClick={() => joinRoom({ roomId: 'test-123' })}>Join Room</button>
    </div>
  );
};

describe('SocketContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('provides initial state', () => {
    render(
      <AppStateProvider>
        <SocketContextProvider>
          <TestComponent />
        </SocketContextProvider>
      </AppStateProvider>
    );

    expect(screen.getByTestId('room-id')).toHaveTextContent('');
    expect(screen.getByTestId('is-creator')).toHaveTextContent('false');
    expect(screen.getByTestId('participants')).toHaveTextContent('0');
    expect(screen.getByTestId('has-local-stream')).toHaveTextContent('false');
    expect(screen.getByTestId('video-enabled')).toHaveTextContent('true');
    expect(screen.getByTestId('audio-enabled')).toHaveTextContent('true');
  });

  test('creates a socket connection on mount', () => {
    render(
      <AppStateProvider>
        <SocketContextProvider>
          <TestComponent />
        </SocketContextProvider>
      </AppStateProvider>
    );
    
    const { io } = require('socket.io-client');
    expect(io).toHaveBeenCalledWith('http://localhost:3000');
  });

  test('emits create-room event when createRoom is called', async () => {
    const { getByText } = render(
      <AppStateProvider>
        <SocketContextProvider>
          <TestComponent />
        </SocketContextProvider>
      </AppStateProvider>
    );
    
    const createButton = getByText('Create Room');
    createButton.click();
    
    const { io } = require('socket.io-client');
    const mockSocket = io();
    
    await waitFor(() => {
      expect(mockSocket.emit).toHaveBeenCalledWith('create-room', expect.any(Object));
    });
  });

  test('emits join-room event when joinRoom is called', async () => {
    const { getByText } = render(
      <AppStateProvider>
        <SocketContextProvider>
          <TestComponent />
        </SocketContextProvider>
      </AppStateProvider>
    );
    
    const joinButton = getByText('Join Room');
    joinButton.click();
    
    const { io } = require('socket.io-client');
    const mockSocket = io();
    
    await waitFor(() => {
      expect(mockSocket.emit).toHaveBeenCalledWith('join-room', expect.objectContaining({
        roomId: 'test-123'
      }));
    });
  });
}); 