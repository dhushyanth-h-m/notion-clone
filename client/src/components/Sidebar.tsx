import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { toggleSidebar } from '../store/uiSlice';

export default function Sidebar() {
    const isOpen = useSelector((state: RootState) => state.ui.isSidebarOpen);
    const dispatch = useDispatch();

    return (
        <div className={`sidebar ${isOpen ? '' : 'closed'}`}>
            <button onClick={() => dispatch(toggleSidebar())}>
                {isOpen ? '<<' : '>>'}    
            </button>
            <div className="pages">
                <h3>Pages</h3>
                <ul>
                    <li>Page 1</li>
                    <li>Page 2</li>    
                </ul>
            </div>
        </div>
    );
}

