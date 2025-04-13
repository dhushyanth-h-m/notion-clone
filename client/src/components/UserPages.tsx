import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { setCurrentPage } from '../store/pagesSlice';
import NewPageForm from './NewPageForm';

const UserPages: React.FC = () => {
  const dispatch = useDispatch();
  const [showNewPageForm, setShowNewPageForm] = useState(false);
  const currentUserId = useSelector((state: RootState) => state.users.currentUserId);
  const currentUser = useSelector((state: RootState) => 
    state.users.users.find(u => u.id === currentUserId)
  );
  const pages = useSelector((state: RootState) => 
    state.pages.pages.filter(page => page.userId === currentUserId)
  );
  const currentPageId = useSelector((state: RootState) => state.pages.currentPageId);

  // Select the first page by default if none is selected
  useEffect(() => {
    if (pages.length > 0 && !currentPageId) {
      dispatch(setCurrentPage(pages[0].id));
    }
  }, [pages, currentPageId, dispatch]);

  const handlePageClick = (pageId: string) => {
    dispatch(setCurrentPage(pageId));
  };

  const renderPages = () => {
    if (!pages.length) {
      return <div className="no-pages">No pages yet. Create your first page!</div>;
    }

    return (
      <ul className="pages-list">
        {pages.map(page => (
          <li 
            key={page.id} 
            className={`page-item ${currentPageId === page.id ? 'active' : ''}`}
            onClick={() => handlePageClick(page.id)}
          >
            {page.title}
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="user-pages">
      <div className="user-info">
        <h3>{currentUser?.name}'s Pages</h3>
        <button 
          className="new-page-btn"
          onClick={() => setShowNewPageForm(true)}
        >
          + New Page
        </button>
      </div>
      {renderPages()}
      
      {showNewPageForm && (
        <div className="modal">
          <NewPageForm onClose={() => setShowNewPageForm(false)} />
        </div>
      )}
    </div>
  );
};

export default UserPages;
