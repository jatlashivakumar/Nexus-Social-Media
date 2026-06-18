/**
 * Redux action logger middleware — only active in development.
 * Logs dispatched actions and resulting state changes to console.
 */
const actionLogger = (store) => (next) => (action) => {
  if (import.meta.env.DEV && typeof action.type === 'string') {
    const prevState = store.getState();
    const result    = next(action);
    const nextState = store.getState();

    console.group(`%c Redux: ${action.type}`, 'color: #6366f1; font-weight: bold;');
    console.log('%c Payload:', 'color: #10b981;', action.payload);
    console.groupEnd();

    return result;
  }
  return next(action);
};

export default actionLogger;
