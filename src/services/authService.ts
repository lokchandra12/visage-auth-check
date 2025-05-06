
import { UserAuth, FaceImage } from '../models/faceTypes';

// Simulate a database with localStorage
const USERS_KEY = 'face_auth_users';
const CURRENT_USER_KEY = 'face_auth_current_user';

export const saveUser = (userAuth: UserAuth): void => {
  const existingUsers = getUsers();
  const userIndex = existingUsers.findIndex(u => u.username === userAuth.username);
  
  if (userIndex >= 0) {
    existingUsers[userIndex] = userAuth;
  } else {
    existingUsers.push(userAuth);
  }
  
  localStorage.setItem(USERS_KEY, JSON.stringify(existingUsers));
};

export const getUsers = (): UserAuth[] => {
  const users = localStorage.getItem(USERS_KEY);
  return users ? JSON.parse(users) : [];
};

export const getUserByUsername = (username: string): UserAuth | undefined => {
  const users = getUsers();
  return users.find(u => u.username === username);
};

export const setCurrentUser = (username: string | null): void => {
  if (username) {
    localStorage.setItem(CURRENT_USER_KEY, username);
  } else {
    localStorage.removeItem(CURRENT_USER_KEY);
  }
};

export const getCurrentUser = (): string | null => {
  return localStorage.getItem(CURRENT_USER_KEY);
};

export const clearCurrentUser = (): void => {
  localStorage.removeItem(CURRENT_USER_KEY);
};

export const getUserFaces = (username: string): FaceImage[] => {
  const user = getUserByUsername(username);
  return user ? user.faceImages : [];
};

export const saveFaceImages = (username: string, faces: FaceImage[]): void => {
  const user = getUserByUsername(username);
  
  if (user) {
    user.faceImages = faces;
    saveUser(user);
  }
};

export const clearAllData = (): void => {
  localStorage.removeItem(USERS_KEY);
  localStorage.removeItem(CURRENT_USER_KEY);
};
