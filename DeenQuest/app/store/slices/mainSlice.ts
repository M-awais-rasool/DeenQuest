import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthUser } from '../services/api';

interface MainState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: AuthUser | null;
  accessToken: string | null;
  error: string | null;
}

const initialState: MainState = {
  isAuthenticated: false,
  isLoading: true,
  user: null,
  accessToken: null,
  error: null,
};

const mainSlice = createSlice({
  name: 'main',
  initialState,
  reducers: {
    setIsAuthenticated: (state, action: PayloadAction<boolean>) => {
      state.isAuthenticated = action.payload;
    },
    setIsLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setUser: (state, action: PayloadAction<AuthUser | null>) => {
      state.user = action.payload;
    },
    setAccessToken: (state, action: PayloadAction<string | null>) => {
      state.accessToken = action.payload;
      if (action.payload) {
        AsyncStorage.setItem('accessToken', action.payload);
      } else {
        AsyncStorage.removeItem('accessToken');
      }
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    logout: (state) => {
      state.isAuthenticated = false;
      state.user = null;
      state.accessToken = null;
      state.error = null;
      AsyncStorage.removeItem('accessToken');
    },
    restoreAuth: (state, action: PayloadAction<{ token: string | null; user: AuthUser | null }>) => {
      if (action.payload.token) {
        state.isAuthenticated = true;
        state.accessToken = action.payload.token;
        state.user = action.payload.user;
      } else {
        state.isAuthenticated = false;
        state.accessToken = null;
        state.user = null;
      }
      state.isLoading = false;
    },
  },
});

export const {
  setIsAuthenticated,
  setIsLoading,
  setUser,
  setAccessToken,
  setError,
  logout,
  restoreAuth,
} = mainSlice.actions;

export default mainSlice.reducer;