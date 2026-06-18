import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { userApi } from '@/services/api';

/* ── Async thunks ──────────────────────────────────────────────── */
export const fetchUserProfile = createAsyncThunk(
  'users/fetchProfile',
  async (username, { rejectWithValue }) => {
    try {
      const { data } = await userApi.getProfile(username);
      return data.data;
    } catch (e) {
      return rejectWithValue(e.response?.data?.message || 'Failed to load profile');
    }
  }
);

export const followUser = createAsyncThunk(
  'users/follow',
  async (userId, { rejectWithValue }) => {
    try {
      const { data } = await userApi.follow(userId);
      return { userId, isFollowing: data.data.isFollowing };
    } catch (e) {
      return rejectWithValue(e.response?.data?.message || 'Action failed');
    }
  }
);

/* ── Slice ─────────────────────────────────────────────────────── */
const userSlice = createSlice({
  name: 'users',
  initialState: {
    profiles: {},      // username → profile data
    loading: {},       // username → bool
    errors: {},        // username → error string
    suggestedUsers: [],
    suggestedLoading: false,
  },
  reducers: {
    clearProfile: (state, action) => {
      delete state.profiles[action.payload];
    },
    setSuggestedUsers: (state, action) => {
      state.suggestedUsers = action.payload;
    },
    updateFollowStatus: (state, action) => {
      const { username, isFollowing } = action.payload;
      if (state.profiles[username]) {
        state.profiles[username].isFollowing = isFollowing;
        state.profiles[username].followersCount += isFollowing ? 1 : -1;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserProfile.pending, (state, action) => {
        state.loading[action.meta.arg] = true;
        delete state.errors[action.meta.arg];
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        const username = action.meta.arg;
        state.loading[username] = false;
        state.profiles[username] = action.payload;
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        const username = action.meta.arg;
        state.loading[username] = false;
        state.errors[username] = action.payload;
      });
  },
});

export const { clearProfile, setSuggestedUsers, updateFollowStatus } = userSlice.actions;

/* ── Selectors ─────────────────────────────────────────────────── */
export const selectUserProfile    = (username) => (state) => state.users?.profiles[username];
export const selectUserLoading    = (username) => (state) => state.users?.loading[username];
export const selectSuggestedUsers = (state) => state.users?.suggestedUsers;

export default userSlice.reducer;
