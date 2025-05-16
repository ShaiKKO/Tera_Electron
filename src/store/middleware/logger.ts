import { Middleware } from '@reduxjs/toolkit';

/**
 * Redux middleware for logging actions and state changes
 * Only active in development mode
 */
export const loggerMiddleware: Middleware = store => next => action => {
  // Skip logging if not in development or if action type indicates it should be skipped
  if (
    process.env.NODE_ENV !== 'development' ||
    action.type?.endsWith('/pending') || // Skip thunk pending actions
    action.type === 'ui/updateViewport' // Skip frequently dispatched actions
  ) {
    return next(action);
  }

  console.group(`%c Action: ${action.type}`, 'color: #7c5295; font-weight: bold');
  console.log('%c Previous State:', 'color: #9E9E9E', store.getState());
  console.log('%c Action:', 'color: #00A7F7', action);
  
  // Pass the action to the next dispatch method
  const result = next(action);
  
  // Log the next state
  console.log('%c Next State:', 'color: #47B04B', store.getState());
  console.groupEnd();
  
  // Return the result of the next dispatch method
  return result;
};

export default loggerMiddleware;
