import { createSlice } from '@reduxjs/toolkit';

const slice = createSlice({
  name: 'ui',
  initialState: {
    // Use nexus-theme key to match main.jsx
    theme: localStorage.getItem('nexus-theme') || 'light',
    modal: null,            // { type, props? }
    searchOpen: false,
    sidebarOpen: false,
    logoutModalOpen: false,
  },
  reducers: {
    toggleTheme: (s) => {
      s.theme = s.theme === 'light' ? 'dark' : 'light';
      localStorage.setItem('nexus-theme', s.theme);
      document.documentElement.classList.toggle('dark', s.theme === 'dark');
    },
    setTheme: (s, a) => {
      s.theme = a.payload;
      localStorage.setItem('nexus-theme', a.payload);
      document.documentElement.classList.toggle('dark', a.payload === 'dark');
    },
    openModal:        (s, a) => { s.modal = a.payload; },
    closeModal:       (s)    => { s.modal = null; },
    setSearchOpen:    (s, a) => { s.searchOpen = a.payload; },
    setSidebarOpen:   (s, a) => { s.sidebarOpen = a.payload; },
    openLogoutModal:  (s)    => { s.logoutModalOpen = true; },
    closeLogoutModal: (s)    => { s.logoutModalOpen = false; },
  },
});

export const {
  toggleTheme, setTheme, openModal, closeModal,
  setSearchOpen, setSidebarOpen, openLogoutModal, closeLogoutModal,
} = slice.actions;

export const selectTheme          = (s) => s.ui.theme;
export const selectModal          = (s) => s.ui.modal;
export const selectSearchOpen     = (s) => s.ui.searchOpen;
export const selectSidebarOpen    = (s) => s.ui.sidebarOpen;
export const selectLogoutModalOpen= (s) => s.ui.logoutModalOpen;

export default slice.reducer;
