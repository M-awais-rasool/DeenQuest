import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Base query with auth handling
const baseQueryWithAuth = fetchBaseQuery({
  baseUrl: 'http://172.16.1.63:8080',
  prepareHeaders: async headers => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
    } catch (error) {
      console.warn('Failed to get token from AsyncStorage', error);
    }
    return headers;
  },
});

// Auth DTOs
export interface SignupRequest {
  email: string;
  password: string;
  role?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthUser {
  id: string;
  email: string;
  role: string;
  is_verified: boolean;
}

export interface AuthResponse {
  user: AuthUser;
  access_token: string;
}

export interface APIResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

// API Service
export const API = createApi({
  reducerPath: 'API',
  baseQuery: baseQueryWithAuth,
  tagTypes: [
    'User',
    'Auth',
  ],
  endpoints: builder => ({
    signup: builder.mutation<APIResponse<AuthResponse>, SignupRequest>({
      query: credentials => ({
        url: '/api/v1/auth/signup',
        method: 'POST',
        body: credentials,
      }),
      invalidatesTags: ['Auth'],
    }),
    login: builder.mutation<APIResponse<AuthResponse>, LoginRequest>({
      query: credentials => ({
        url: '/api/v1/auth/login',
        method: 'POST',
        body: credentials,
      }),
      invalidatesTags: ['Auth'],
    }),
    getProfile: builder.query<APIResponse<AuthUser>, void>({
      query: () => ({
        url: '/api/v1/users/me',
        method: 'GET',
      }),
      providesTags: ['User'],
    }),
    updateProfile: builder.mutation<APIResponse<AuthUser>, Partial<AuthUser>>({
      query: data => ({
        url: '/api/v1/users/me',
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['User'],
    }),
  }),
});

// Export hooks
export const {
  useSignupMutation,
  useLoginMutation,
  useGetProfileQuery,
  useUpdateProfileMutation,
} = API;
