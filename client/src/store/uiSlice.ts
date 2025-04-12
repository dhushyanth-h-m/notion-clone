import { createSlice } from '@reduxjs/toolkit';

interface UIState {
    isSidebarOpen: boolean;
}

const initialState: UIState = {
    isSidebarOpen: true,
};

export const uiSlice = createSlice({
    name: 'ui',
    initialState,
    reducers: {
        toggleSidebar: (state) => {
            state.isSidebarOpen = !state.isSidebarOpen;
        },
    },
});

export const { toggleSidebar } = uiSlice.actions;
export default uiSlice.reducer;