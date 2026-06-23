import API from './api';

export const createRoom = async (name) => {
  const response = await API.post('/rooms', { name });
  return response.data;
};

export const joinRoom = async (code) => {
  const response = await API.post('/rooms/join', { code });
  return response.data;
};

export const getRoom = async (code) => {
  const response = await API.get(`/rooms/${code}`);
  return response.data;
};
