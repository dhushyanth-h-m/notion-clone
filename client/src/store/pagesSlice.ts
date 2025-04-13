import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Page } from '../types/page';

interface PagesState {
    pages: Page[];
    currentPageId: string | null;
}

const initialState: PagesState = {
    pages: [],
    currentPageId: null,
}

export const pagesSlice = createSlice({
    name: 'pages',
    initialState,
    reducers: {
        addPage: (state, action: PayloadAction<Page>) => {
            state.pages.push(action.payload);
        },
        setCurrentPage: (state, action: PayloadAction<string>) => {
            state.currentPageId = action.payload;
        },
        updatePageTitle: (state, action: PayloadAction<{ id: string; title: string }>) => {
            const page = state.pages.find(p => p.id === action.payload.id);
            if (page) {
                page.title = action.payload.title;
                page.updatedAt = new Date();
            }
        },
        addBlockToPage: (state, action: PayloadAction<{ pageId: string; blockId: string }>) => {
            const page = state.pages.find(p => p.id === action.payload.pageId);
            if (page) {
                page.blockIds.push(action.payload.blockId);
                page.updatedAt = new Date();
            }
        },
        removeBlockFromPage: (state, action: PayloadAction<{ pageId: string; blockId: string}>) => {
            const page = state.pages.find(p => p.id === action.payload.pageId);
            if (page) {
                page.blockIds = page.blockIds.filter(id => id !== action.payload.blockId);
                page.updatedAt = new Date();
            }
        },
        removePage: (state, action: PayloadAction<string>) => {
            state.pages = state.pages.filter(p => p.id !== action.payload);
            if (state.currentPageId === action.payload) {
                state.currentPageId = null;
            }
        },
    },
});


export const {
    addPage,
    setCurrentPage,
    updatePageTitle,
    addBlockToPage,
    removeBlockFromPage,
    removePage
} = pagesSlice.actions;

export default pagesSlice.reducer;
