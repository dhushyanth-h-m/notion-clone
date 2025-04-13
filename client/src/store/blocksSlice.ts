import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Block } from '../types/block';

interface BlocksState {
    blocks: Block[];
}

const initialState: BlocksState = {
    blocks: [],
};

export const blocksSlice = createSlice({
    name: 'blocks',
    initialState,
    reducers: {
        addBlock: (state, action: PayloadAction<Block>) => {
            state.blocks.push(action.payload);
        },
        updateBlock: (state, action: PayloadAction<{ id: string; content: string }>) => {
            const block = state.blocks.find(b => b.id === action.payload.id);
            if (block) block.content = action.payload.content;
        },
        removeBlock: (state, action: PayloadAction<string>) => {
            state.blocks = state.blocks.filter(block => block.id !== action.payload);
        },
        updateBlockType: (state, action: PayloadAction<{ id: string; type: 'text' | 'heading' | 'list' }>) => {
            const block = state.blocks.find(b => b.id === action.payload.id);
            if (block) block.type = action.payload.type;
        },
    },
});

export const { addBlock, updateBlock, removeBlock, updateBlockType } = blocksSlice.actions;
export default blocksSlice.reducer;