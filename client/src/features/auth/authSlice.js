import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '@/api/axios';

// ── Async thunks ──────────────────────────────────────────────
export const loginUser = createAsyncThunk('auth/login', async (d, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/login', d);
    localStorage.setItem('accessToken', data.accessToken);
    return data.user;
  } catch (e) { return rejectWithValue(e.response?.data?.message || 'Login failed'); }
});

export const registerUser = createAsyncThunk('auth/register', async (d, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/register', d);
    localStorage.setItem('accessToken', data.accessToken);
    return data.user;
  } catch (e) { return rejectWithValue(e.response?.data?.message || 'Registration failed'); }
});

export const logoutUser = createAsyncThunk('auth/logout', async () => {
  try { await api.post('/auth/logout'); } catch { /* ignore */ }
  finally { localStorage.removeItem('accessToken'); }
});

export const fetchCurrentUser = createAsyncThunk('auth/fetchMe', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/auth/me');
    return data.data;
  } catch (e) { return rejectWithValue(e.response?.data?.message); }
});

export const updateProfile = createAsyncThunk('auth/updateProfile', async (formData, { rejectWithValue }) => {
  try {
    // Accept either FormData (for file uploads) or plain object
    const payload = formData instanceof FormData ? formData : (() => {
      const fd = new FormData();
      Object.entries(formData).forEach(([k, v]) => {
        if (v !== undefined && v !== null) {
          if (v instanceof File) fd.append(k, v);
          else if (typeof v === 'object') fd.append(k, JSON.stringify(v));
          else fd.append(k, String(v));
        }
      });
      return fd;
    })();
    const { data } = await api.patch('/users/me/profile', payload, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.data;
  } catch (e) { return rejectWithValue(e.response?.data?.message || 'Update failed'); }
});

// ── Slice ─────────────────────────────────────────────────────
const slice = createSlice({
  name: 'auth',
  initialState: { user: null, isAuthenticated: false, isLoading: false, isInitialized: false, error: null },
  reducers: {
    clearError:     (s)    => { s.error = null; },
    setInitialized: (s)    => { s.isInitialized = true; },
    updateUserField:(s, a) => { if (s.user) Object.assign(s.user, a.payload); },
  },
  extraReducers: (b) => {
    const pending  = (s)    => { s.isLoading = true; s.error = null; };
    const rejected = (s, a) => { s.isLoading = false; s.error = a.payload; };

    b.addCase(loginUser.pending,    pending)
     .addCase(loginUser.fulfilled,  (s, a) => { s.isLoading=false; s.user=a.payload; s.isAuthenticated=true; s.isInitialized=true; })
     .addCase(loginUser.rejected,   rejected)
     .addCase(registerUser.pending,   pending)
     .addCase(registerUser.fulfilled, (s, a) => { s.isLoading=false; s.user=a.payload; s.isAuthenticated=true; s.isInitialized=true; })
     .addCase(registerUser.rejected,  rejected)
     .addCase(logoutUser.fulfilled,   (s) => { s.user=null; s.isAuthenticated=false; s.isInitialized=true; })
     .addCase(fetchCurrentUser.pending,   (s) => { s.isLoading=true; })
     .addCase(fetchCurrentUser.fulfilled, (s, a) => { s.user=a.payload; s.isAuthenticated=true; s.isLoading=false; s.isInitialized=true; })
     .addCase(fetchCurrentUser.rejected,  (s) => { s.user=null; s.isAuthenticated=false; s.isLoading=false; s.isInitialized=true; })
     .addCase(updateProfile.pending,   pending)
     .addCase(updateProfile.fulfilled, (s, a) => { s.isLoading=false; s.user=a.payload; })
     .addCase(updateProfile.rejected,  rejected);
  },
});

export const { clearError, setInitialized, updateUserField } = slice.actions;

export const selectUser            = (s) => s.auth.user;
export const selectIsAuthenticated = (s) => s.auth.isAuthenticated;
export const selectAuthLoading     = (s) => s.auth.isLoading;
export const selectAuthError       = (s) => s.auth.error;
export const selectIsInitialized   = (s) => s.auth.isInitialized;

export default slice.reducer;
