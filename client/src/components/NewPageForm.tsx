import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { addPage, setCurrentPage } from '../store/pagesSlice';
import { addPageToUser } from '../store/usersSlice';
import { v4 as uuidv4 } from 'uuid';

const NewPageForm: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const dispatch = useDispatch();
  const [title, setTitle] = useState('');
  const currentUserId = useSelector((state: RootState) => state.users.currentUserId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUserId) return;
    
    const newPageId = uuidv4();
    const newPage = {
      id: newPageId,
      userId: currentUserId,
      title: title || 'Untitled',
      blockIds: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    dispatch(addPage(newPage));
    dispatch(addPageToUser({ userId: currentUserId, pageId: newPageId }));
    dispatch(setCurrentPage(newPageId));
    onClose();
  };

  return (
    <div className="new-page-form">
      <h3>Create New Page</h3>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter page title"
          autoFocus
        />
        <div className="form-actions">
          <button type="button" onClick={onClose}>Cancel</button>
          <button type="submit">Create</button>
        </div>
      </form>
    </div>
  );
};

export default NewPageForm;
