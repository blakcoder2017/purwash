import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { AuthContextType, AuthState, LoginCredentials, RegisterData } from '../types/auth';
import { authApi } from '../services/auth';

// Auth state reducer
type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: { user: any; token: string } }
  | { type: 'AUTH_FAILURE'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'CLEAR_ERROR' }
  | { type: 'UPDATE_USER'; payload: any };

const initialState: AuthState = {
  user: null,
  token: authApi.getToken(),
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    case 'AUTH_SUCCESS':
      return {
        ...state,
        isLoading: false,
        isAuthenticated: true,
        user: action.payload.user,
        token: action.payload.token,
        error: null,
      };
    case 'AUTH_FAILURE':
      return {
        ...state,
        isLoading: false,
        isAuthenticated: false,
        user: null,
        token: null,
        error: action.payload,
      };
    case 'LOGOUT':
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        token: null,
        error: null,
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    case 'UPDATE_USER':
      return {
        ...state,
        user: action.payload,
      };
    default:
      return state;
  }
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Initialize auth state on mount
  useEffect(() => {
    const initializeAuth = async () => {
      const token = authApi.getToken();
      if (token) {
        try {
          dispatch({ type: 'AUTH_START' });
          const response = await authApi.getProfile();
          if (response.success) {
            dispatch({
              type: 'AUTH_SUCCESS',
              payload: {
                user: response.data.user,
                token,
              },
            });
          } else {
            dispatch({ type: 'LOGOUT' });
            authApi.removeToken();
          }
        } catch (error) {
          dispatch({ type: 'LOGOUT' });
          authApi.removeToken();
        }
      }
    };

    initializeAuth();
  }, []);

  const login = async (credentials: LoginCredentials) => {
    try {
      dispatch({ type: 'AUTH_START' });
      const response = await authApi.login(credentials);
      
      if (response.success) {
        const { user, token } = response.data;
        authApi.setToken(token);
        dispatch({
          type: 'AUTH_SUCCESS',
          payload: { user, token },
        });
      } else {
        dispatch({ type: 'AUTH_FAILURE', payload: response.message });
      }
    } catch (error) {
      dispatch({
        type: 'AUTH_FAILURE',
        payload: error instanceof Error ? error.message : 'Login failed',
      });
    }
  };

  const register = async (data: RegisterData) => {
    try {
      dispatch({ type: 'AUTH_START' });
      const response = await authApi.register(data);
      
      if (response.success) {
        const { user, token } = response.data;
        authApi.setToken(token);
        dispatch({
          type: 'AUTH_SUCCESS',
          payload: { user, token },
        });
      } else {
        dispatch({ type: 'AUTH_FAILURE', payload: response.message });
      }
    } catch (error) {
      dispatch({
        type: 'AUTH_FAILURE',
        payload: error instanceof Error ? error.message : 'Registration failed',
      });
    }
  };

  const logout = () => {
    authApi.removeToken();
    dispatch({ type: 'LOGOUT' });
  };

  const refreshToken = async () => {
    try {
      const response = await authApi.refreshToken();
      if (response.success) {
        const { token } = response.data;
        authApi.setToken(token);
        dispatch({
          type: 'AUTH_SUCCESS',
          payload: {
            user: state.user!,
            token,
          },
        });
      }
    } catch (error) {
      // If refresh fails, logout the user
      logout();
    }
  };

  const updateProfile = async (profile: Partial<any>) => {
    try {
      const response = await authApi.updateProfile(profile);
      if (response.success) {
        dispatch({
          type: 'UPDATE_USER',
          payload: response.data.user,
        });
      }
    } catch (error) {
      dispatch({
        type: 'AUTH_FAILURE',
        payload: error instanceof Error ? error.message : 'Profile update failed',
      });
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    try {
      const response = await authApi.changePassword(currentPassword, newPassword);
      if (response.success) {
        // Password changed successfully
        return;
      }
      throw new Error(response.message);
    } catch (error) {
      dispatch({
        type: 'AUTH_FAILURE',
        payload: error instanceof Error ? error.message : 'Password change failed',
      });
    }
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const value: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    refreshToken,
    updateProfile,
    changePassword,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
