import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { toggleSidebar } from '../store/uiSlice';
import UserPages from './UserPages';

export default function Sidebar() {
    const isOpen = useSelector((state: RootState) => state.ui.isSidebarOpen);
    const dispatch = useDispatch();

    return (
        <div className={`sidebar ${isOpen ? '' : 'closed'}`}>
            <button onClick={() => dispatch(toggleSidebar())}>
                {isOpen ? '<<' : '>>'}    
            </button>
            <UserPages />
        </div>
    );
}

