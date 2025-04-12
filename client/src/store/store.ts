import { configureStore } from '@reduxjs/toolkit';
import blocksReducer from './blocksSlice';
import uiReducer from './uiSlice';

export const store = configureStore({
    reducer: {
        blocks: blocksReducer,
        ui: uiReducer,
    },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
