import React, { useEffect, useState } from 'react';
import { pagesApi, Page } from '../../api/pages';
import { useAuth } from '../../context/AuthContext';
import './PagesList.css';

interface PagesListProps {
  onSelectPage: (page: Page) => void;
  onCreatePage: () => void;
  selectedPageId?: string;
}

const PagesList: React.FC<PagesListProps> = ({ onSelectPage, onCreatePage, selectedPageId }) => {
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      fetchPages();
    }
  }, [isAuthenticated]);

  const fetchPages = async () => {
    try {
      setLoading(true);
      const fetchedPages = await pagesApi.getAllPages();
      setPages(fetchedPages);
      setError(null);
    } catch (err) {
      console.error('Error fetching pages:', err);
      setError('Failed to load pages. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePage = async (e: React.MouseEvent, pageId: string) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this page?')) {
      return;
    }
    
    try {
      await pagesApi.deletePage(pageId);
      setPages(pages.filter(page => page.id !== pageId));
    } catch (err) {
      console.error('Error deleting page:', err);
      setError('Failed to delete page. Please try again.');
    }
  };

  if (loading) {
    return <div className="pages-list-loading">Loading your pages...</div>;
  }

  if (error) {
    return <div className="pages-list-error">{error}</div>;
  }

  return (
    <div className="pages-list-container">
      <div className="pages-list-header">
        <h2>Your Pages</h2>
        <button className="create-page-button" onClick={onCreatePage}>
          + New Page
        </button>
      </div>
      
      {pages.length === 0 ? (
        <div className="no-pages-message">
          <p>You don't have any pages yet.</p>
          <button className="create-first-page-button" onClick={onCreatePage}>
            Create your first page
          </button>
        </div>
      ) : (
        <ul className="pages-list">
          {pages.map(page => (
            <li 
              key={page.id} 
              className={`page-item ${selectedPageId === page.id ? 'selected' : ''}`}
              onClick={() => onSelectPage(page)}
            >
              <div className="page-title">{page.title}</div>
              <div className="page-actions">
                <button 
                  className="delete-page-button"
                  onClick={(e) => handleDeletePage(e, page.id)}
                >
                  🗑️
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default PagesList; 