import { configureStore } from '@reduxjs/toolkit';
import blocksReducer from './blocksSlice';
import uiReducer from './uiSlice';
import usersReducer from './usersSlice';
import pagesReducer from './pagesSlice';

export const store = configureStore({
    reducer: {
        blocks: blocksReducer,
        ui: uiReducer,
        users: usersReducer,
        pages: pagesReducer,
    },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
