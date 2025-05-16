import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface ModalProps {
  title?: string;
  message?: string;
  showFooter?: boolean;
  showCancel?: boolean;
}

interface ModalState {
  isOpen: boolean;
  modalType: 'settings' | 'newGame' | 'loadGame' | 'confirm' | null;
  modalProps: ModalProps;
}

export type ViewType = 'worldView' | 'colonyManagement' | 'resources' | 'research' | 
                     'gameOptions' | 'graphics' | 'audio' | 'building' | 'zones' | 'orders' |
                     'welcome';

export interface UiState {
  themeMode: ThemeMode;
  sidebar: {
    isOpen: boolean;
    width: number;
  };
  modal: ModalState;
  isMenuOpen: boolean;
  viewport: {
    width: number;
    height: number;
  };
  zoomLevel: number;
  debugMode: boolean;
  activeView: ViewType;
}

const initialState: UiState = {
  themeMode: 'system',
  sidebar: {
    isOpen: true,
    width: 280,
  },
  modal: {
    isOpen: false,
    modalType: null,
    modalProps: {},
  },
  isMenuOpen: false,
  viewport: {
    width: window.innerWidth,
    height: window.innerHeight,
  },
  zoomLevel: 1,
  debugMode: process.env.NODE_ENV === 'development',
  activeView: 'welcome',
};

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    /**
     * Set the theme mode
     */
    setTheme: (state, action: PayloadAction<ThemeMode>) => {
      state.themeMode = action.payload;
      // Save to localStorage for persistence
      localStorage.setItem('themeMode', action.payload);
    },
    
    /**
     * Toggle the sidebar open/closed state
     */
    toggleSidebar: (state) => {
      state.sidebar.isOpen = !state.sidebar.isOpen;
    },
    
    /**
     * Set the sidebar width
     */
    setSidebarWidth: (state, action: PayloadAction<number>) => {
      state.sidebar.width = action.payload;
    },
    
    /**
     * Open a modal with specified type and props
     */
    openModal: (state, action: PayloadAction<{ modalType: ModalState['modalType']; modalProps?: ModalProps }>) => {
      state.modal.isOpen = true;
      state.modal.modalType = action.payload.modalType;
      state.modal.modalProps = action.payload.modalProps || {};
    },
    
    /**
     * Close the currently open modal
     */
    closeModal: (state) => {
      state.modal.isOpen = false;
      // Keep the type and props for potential animations during closing
    },
    
    /**
     * Update viewport dimensions (usually on resize)
     */
    updateViewport: (state, action: PayloadAction<{ width: number; height: number }>) => {
      state.viewport = action.payload;
    },
    
    /**
     * Set the zoom level for the game view
     */
    setZoomLevel: (state, action: PayloadAction<number>) => {
      // Ensure zoom level is within allowed bounds
      const clampedZoom = Math.min(Math.max(action.payload, 0.25), 4);
      state.zoomLevel = clampedZoom;
    },
    
    /**
     * Toggle debug mode
     */
    toggleDebugMode: (state) => {
      state.debugMode = !state.debugMode;
    },
    
    /**
     * Toggle menu open state
     */
    toggleMenu: (state) => {
      state.isMenuOpen = !state.isMenuOpen;
    },
    
    /**
     * Set the active view/section
     */
    setActiveView: (state, action: PayloadAction<ViewType>) => {
      state.activeView = action.payload;
    }
  }
});

export const { 
  setTheme, 
  toggleSidebar, 
  setSidebarWidth, 
  openModal, 
  closeModal, 
  updateViewport,
  setZoomLevel,
  toggleDebugMode,
  toggleMenu,
  setActiveView
} = uiSlice.actions;

export default uiSlice.reducer;
