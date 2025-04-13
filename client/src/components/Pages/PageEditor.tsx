import React, { useState, useEffect } from 'react';
import { pagesApi, Page } from '../../api/pages';
import './PageEditor.css';

interface PageEditorProps {
  pageId?: number;
  onPageSaved?: (page: Page) => void;
}

const PageEditor: React.FC<PageEditorProps> = ({ pageId, onPageSaved }) => {
  const [title, setTitle] = useState('Untitled');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isNewPage, setIsNewPage] = useState(true);

  useEffect(() => {
    if (pageId) {
      loadPage(pageId);
      setIsNewPage(false);
    } else {
      // Reset for a new page
      setTitle('Untitled');
      setContent('');
      setLastSaved(null);
      setIsNewPage(true);
    }
  }, [pageId]);

  const loadPage = async (id: number) => {
    try {
      const page = await pagesApi.getPage(id);
      setTitle(page.title);
      setContent(page.content);
      setLastSaved(new Date(page.updated_at));
      setError(null);
    } catch (err) {
      console.error('Error loading page:', err);
      setError('Failed to load page. Please try again.');
    }
  };

  const savePage = async () => {
    setSaving(true);
    
    try {
      let savedPage: Page;
      
      if (isNewPage) {
        savedPage = await pagesApi.createPage(title, content);
        setIsNewPage(false);
        
        // Update URL with new page ID without refreshing
        window.history.pushState({}, '', `/pages/${savedPage.id}`);
      } else if (pageId) {
        savedPage = await pagesApi.updatePage(pageId, { title, content });
      } else {
        throw new Error('Invalid page state: cannot save');
      }
      
      setLastSaved(new Date(savedPage.updated_at));
      setError(null);
      
      if (onPageSaved) {
        onPageSaved(savedPage);
      }
    } catch (err) {
      console.error('Error saving page:', err);
      setError('Failed to save page. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const formatLastSaved = () => {
    if (!lastSaved) return '';
    
    const now = new Date();
    const diff = now.getTime() - lastSaved.getTime();
    
    // If less than a minute ago
    if (diff < 60 * 1000) {
      return 'just now';
    }
    
    // If less than an hour ago
    if (diff < 60 * 60 * 1000) {
      const minutes = Math.floor(diff / (60 * 1000));
      return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
    }
    
    // Format as time
    return lastSaved.toLocaleTimeString();
  };

  return (
    <div className="page-editor">
      <div className="editor-header">
        <input
          type="text"
          className="page-title-input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Untitled"
        />
        
        <div className="editor-actions">
          {error && <span className="save-error">{error}</span>}
          
          {lastSaved && (
            <span className="last-saved">
              Last saved: {formatLastSaved()}
            </span>
          )}
          
          <button 
            className={`save-button ${saving ? 'saving' : ''}`}
            onClick={savePage}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
      
      <textarea
        className="page-content-editor"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Start writing here..."
      />
    </div>
  );
};

export default PageEditor; 