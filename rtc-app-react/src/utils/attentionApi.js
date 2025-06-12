

const API_URL = 'http://localhost:5000/api';


export const detectAttention = async (imageData, userId) => {
  try {
    const response = await fetch(`${API_URL}/detect_attention`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: imageData,
        userId,
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error detecting attention:', error);
    throw error;
  }
};


export const getRoomAttention = async (roomId, userIds) => {
  try {
    const response = await fetch(`${API_URL}/room_attention`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        roomId,
        userIds,
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting room attention:', error);
    throw error;
  }
};


export const calibrateAttention = async (imageData, userId) => {
  try {
    const response = await fetch(`${API_URL}/calibrate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: imageData,
        userId,
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error calibrating attention:', error);
    throw error;
  }
}; 