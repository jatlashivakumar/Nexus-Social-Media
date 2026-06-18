import { createSlice } from '@reduxjs/toolkit';

/**
 * Lightweight post slice for tracking optimistic like/save state
 * across the app (PostCard, PostDetail, Feed all stay in sync).
 */
const postSlice = createSlice({
  name: 'posts',
  initialState: {
    likedPosts: {},   // postId → bool
    savedPosts: {},   // postId → bool
    likeCounts: {},   // postId → number
  },
  reducers: {
    setLiked: (state, action) => {
      const { postId, liked, count } = action.payload;
      state.likedPosts[postId] = liked;
      if (count !== undefined) state.likeCounts[postId] = count;
    },
    setSaved: (state, action) => {
      const { postId, saved } = action.payload;
      state.savedPosts[postId] = saved;
    },
    hydratePosts: (state, action) => {
      // Called when feed/explore loads — seed initial states
      action.payload.forEach(post => {
        if (state.likedPosts[post._id] === undefined) state.likedPosts[post._id] = post.isLiked ?? false;
        if (state.savedPosts[post._id] === undefined) state.savedPosts[post._id] = post.isSaved ?? false;
        if (state.likeCounts[post._id] === undefined) state.likeCounts[post._id] = post.likesCount ?? 0;
      });
    },
  },
});

export const { setLiked, setSaved, hydratePosts } = postSlice.actions;

export const selectPostLiked = (postId) => (state) => state.posts?.likedPosts[postId];
export const selectPostSaved = (postId) => (state) => state.posts?.savedPosts[postId];
export const selectLikeCount = (postId) => (state) => state.posts?.likeCounts[postId];

export default postSlice.reducer;
