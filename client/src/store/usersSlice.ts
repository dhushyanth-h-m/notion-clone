import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { User } from '../types/user';

interface UserState {
    users: User[];
    currentUserId: string | null;
}

const initialState: UserState = {
    users: [],
    currentUserId: null,
}

export const usersSlice = createSlice({
    name: 'users',
    initialState,
    reducers: {
        addUser: (state, action: PayloadAction<User>) => {
            state.users.push(action.payload);
        },
        setCurrentUser: (state, action: PayloadAction<string>) => {
            state.currentUserId = action.payload;
        },
        addPageToUser: (state, action: PayloadAction<{ userId: string; pageId: string }>) => {
            const user = state.users.find(user => user.id === action.payload.userId);
            if (user) {
                user.pageIds.push(action.payload.pageId);
            }
        },
        removePageFromUser: (state, action: PayloadAction<{ userId: string; pageId: string }>) => {
            const user = state.users.find(user => user.id === action.payload.userId);
            if (user) {
                user.pageIds = user.pageIds.filter(id => id !== action.payload.pageId);
            }
        },
    },
});

export const { addUser, setCurrentUser, addPageToUser, removePageFromUser } = usersSlice.actions;
export default usersSlice.reducer;