import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AppStateProvider, AppStateContext, ERROR_TYPES } from './AppStateContext';

const TestComponent = () => {
  const {
    isLoading,
    loadingMessage,
    error,
    notifications,
    startLoading,
    stopLoading,
    setAppError,
    clearError,
    addNotification,
    removeNotification
  } = React.useContext(AppStateContext);

  return (
    <div>
      <div data-testid="loading-state">{isLoading.toString()}</div>
      <div data-testid="loading-message">{loadingMessage}</div>
      <div data-testid="error">{error ? error.message : 'No error'}</div>
      <div data-testid="notifications-count">{notifications.length}</div>
      
      <button onClick={() => startLoading('Loading test')}>Start Loading</button>
      <button onClick={() => stopLoading()}>Stop Loading</button>
      <button onClick={() => setAppError(ERROR_TYPES.MEDIA_ACCESS, 'Test error')}>Set Error</button>
      <button onClick={() => clearError()}>Clear Error</button>
      <button onClick={() => addNotification('Test notification', 'info', false)}>Add Notification</button>
      {notifications.length > 0 && (
        <button onClick={() => removeNotification(notifications[0].id)}>Remove Notification</button>
      )}
    </div>
  );
};

describe('AppStateContext', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });
  
  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  test('provides initial state', () => {
    render(
      <AppStateProvider>
        <TestComponent />
      </AppStateProvider>
    );

    expect(screen.getByTestId('loading-state')).toHaveTextContent('false');
    expect(screen.getByTestId('loading-message')).toHaveTextContent('');
    expect(screen.getByTestId('error')).toHaveTextContent('No error');
    expect(screen.getByTestId('notifications-count')).toHaveTextContent('0');
  });

  test('handles loading state', () => {
    render(
      <AppStateProvider>
        <TestComponent />
      </AppStateProvider>
    );
    
    const startButton = screen.getByText('Start Loading');
    const stopButton = screen.getByText('Stop Loading');
    
    fireEvent.click(startButton);
    expect(screen.getByTestId('loading-state')).toHaveTextContent('true');
    expect(screen.getByTestId('loading-message')).toHaveTextContent('Loading test');
    
    fireEvent.click(stopButton);
    expect(screen.getByTestId('loading-state')).toHaveTextContent('false');
    expect(screen.getByTestId('loading-message')).toHaveTextContent('');
  });

  test('handles error state', () => {
    render(
      <AppStateProvider>
        <TestComponent />
      </AppStateProvider>
    );
    
    const setErrorButton = screen.getByText('Set Error');
    const clearErrorButton = screen.getByText('Clear Error');
    
    fireEvent.click(setErrorButton);
    expect(screen.getByTestId('error')).toHaveTextContent('Test error');
    
    fireEvent.click(clearErrorButton);
    expect(screen.getByTestId('error')).toHaveTextContent('No error');
  });

  test('handles notifications', () => {
    render(
      <AppStateProvider>
        <TestComponent />
      </AppStateProvider>
    );
    
    const addButton = screen.getByText('Add Notification');
    
    fireEvent.click(addButton);
    expect(screen.getByTestId('notifications-count')).toHaveTextContent('1');
    
    const removeButton = screen.getByText('Remove Notification');
    fireEvent.click(removeButton);
    expect(screen.getByTestId('notifications-count')).toHaveTextContent('0');
  });

  test('auto-removes notifications when autoHide is true', () => {
    jest.useFakeTimers();
    
    render(
      <AppStateProvider>
        <TestComponent />
      </AppStateProvider>
    );
    
    const context = screen.getByText('Add Notification');
    fireEvent.click(context);
    
    expect(screen.getByTestId('notifications-count')).toHaveTextContent('1');
    
    act(() => {
      jest.advanceTimersByTime(5000);
    });
    
    expect(screen.getByTestId('notifications-count')).toHaveTextContent('0');
  });
}); 