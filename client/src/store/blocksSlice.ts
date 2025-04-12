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
        updateBlock: (state, action: PayloadAction<{ id: string; content: string}>) => {
            const block = state.blocks.find( b => b.id === action.payload.id);
            if (block) block.content = action.payload.content;
        },
    },
});

export const { addBlock, updateBlock } = blocksSlice.actions;
export default blocksSlice.reducer;