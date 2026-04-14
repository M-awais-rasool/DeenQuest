import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AuthUser } from '../services/api';
import {
  clearPersistedAuth,
  persistAccessToken,
  persistAuthUser,
  persistIsAuthenticated,
} from '../storage/authStorage';

export interface MainState {
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
      persistIsAuthenticated(action.payload);
    },
    setIsLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setUser: (state, action: PayloadAction<AuthUser | null>) => {
      state.user = action.payload;
      persistAuthUser(action.payload);
    },
    setAccessToken: (state, action: PayloadAction<string | null>) => {
      state.accessToken = action.payload;
      persistAccessToken(action.payload);
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    logout: (state) => {
      state.isAuthenticated = false;
      state.user = null;
      state.accessToken = null;
      state.error = null;
      clearPersistedAuth();
    },
    restoreAuth: (
      state,
      action: PayloadAction<{ token: string | null; user: AuthUser | null }>,
    ) => {
      if (action.payload.token) {
        state.isAuthenticated = true;
        state.accessToken = action.payload.token;
        state.user = action.payload.user;
      } else {
        state.isAuthenticated = false;
        state.accessToken = null;
        state.user = null;
        clearPersistedAuth();
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
