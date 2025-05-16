import { 
  configureStore, 
  combineReducers,
  ThunkAction, 
  Action,
  getDefaultMiddleware 
} from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';

// Import reducers
import uiReducer from './slices/uiSlice';
import appReducer from './slices/appSlice';
import sessionReducer from './slices/sessionSlice';
import gameReducer from './slices/gameSlice';

// Import custom middleware
import loggerMiddleware from './middleware/logger';

// Combine all reducers
const rootReducer = combineReducers({
  ui: uiReducer,
  app: appReducer,
  session: sessionReducer,
  game: gameReducer,
});

// Configure middleware
const middleware = [...getDefaultMiddleware({
  // Customize serializable check to allow for non-serializable Redux state values if needed
  serializableCheck: {
    ignoredActions: [],
    ignoredActionPaths: [],
    ignoredPaths: [],
  },
  // Customize thunk configuration if needed
  thunk: {
    extraArgument: { 
      // Add any extra arguments to thunks here
      // For example, API clients, services, etc.
    },
  },
})];

// Add custom middleware in development mode
if (process.env.NODE_ENV === 'development') {
  middleware.push(loggerMiddleware);
}

// Configure the store
export const store = configureStore({
  reducer: rootReducer,
  middleware,
  devTools: process.env.NODE_ENV !== 'production',
});

// Export types for store
export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = typeof store.dispatch;
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;

// Export typed hooks for use in components
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

// Expose store in development mode for testing
if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
  // Use as any to avoid TypeScript errors with window property
  (window as any).__REDUX_STORE__ = store;
}

export default store;
