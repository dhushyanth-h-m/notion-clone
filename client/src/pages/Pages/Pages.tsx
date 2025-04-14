import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import PagesList from '../../components/Pages/PagesList';
import PageEditor from '../../components/Pages/PageEditor';
import { Page } from '../../api/pages';
import './Pages.css';

const Pages: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [selectedPageId, setSelectedPageId] = useState<string | undefined>(id || undefined);

  useEffect(() => {
    // Update selected page ID when URL changes
    if (id) {
      setSelectedPageId(id);
    } else {
      setSelectedPageId(undefined);
    }
  }, [id]);

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!authLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, authLoading, navigate]);

  const handleSelectPage = (page: Page) => {
    setSelectedPageId(page.id);
    navigate(`/pages/${page.id}`);
  };

  const handleCreatePage = () => {
    setSelectedPageId(undefined);
    navigate('/pages/new');
  };

  const handlePageSaved = (page: Page) => {
    setSelectedPageId(page.id);
    navigate(`/pages/${page.id}`);
  };

  if (authLoading) {
    return <div className="pages-loading">Loading...</div>;
  }

  if (!isAuthenticated) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="pages-container">
      <PagesList
        onSelectPage={handleSelectPage}
        onCreatePage={handleCreatePage}
        selectedPageId={selectedPageId}
      />
      <PageEditor
        pageId={selectedPageId}
        onPageSaved={handlePageSaved}
      />
    </div>
  );
};

export default Pages; 