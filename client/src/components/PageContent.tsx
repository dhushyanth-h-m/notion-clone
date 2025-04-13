import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store/store';
import { updatePageTitle } from '../store/pagesSlice';
import { addBlock, updateBlock } from '../store/blocksSlice';
import { v4 as uuidv4 } from 'uuid'; // You'll need to install this: npm install uuid @types/uuid

const PageContent: React.FC = () => {
  const dispatch = useDispatch();
  const currentPageId = useSelector((state: RootState) => state.pages.currentPageId);
  const currentPage = useSelector((state: RootState) => 
    state.pages.pages.find(p => p.id === currentPageId)
  );
  const blocks = useSelector((state: RootState) => {
    if (!currentPage) return [];
    return currentPage.blockIds.map(
      blockId => state.blocks.blocks.find(b => b.id === blockId)
    ).filter(block => block !== undefined);
  });

  if (!currentPage) {
    return <div className="no-page-selected">No page selected</div>;
  }

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(updatePageTitle({ id: currentPage.id, title: e.target.value }));
  };

  const handleBlockContentChange = (id: string, content: string) => {
    dispatch(updateBlock({ id, content }));
  };

  const handleAddBlock = () => {
    const newBlock = {
      id: uuidv4(),
      type: 'text' as const,
      content: '',
      children: []
    };
    
    dispatch(addBlock(newBlock));
    // You'll also need to add the block to the current page
    // This would require adding an action to pagesSlice
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <input
          type="text"
          className="page-title"
          value={currentPage.title}
          onChange={handleTitleChange}
          placeholder="Untitled"
        />
        <div className="page-meta">
          Last updated: {new Date(currentPage.updatedAt).toLocaleString()}
        </div>
      </div>
      
      <div className="blocks-container">
        {blocks.map(block => (
          <div key={block?.id} className={`block block-${block?.type}`}>
            <textarea
              value={block?.content || ''}
              onChange={(e) => handleBlockContentChange(block?.id || '', e.target.value)}
              placeholder="Type something..."
            />
          </div>
        ))}
      </div>
      
      <button className="add-block-btn" onClick={handleAddBlock}>
        + Add Block
      </button>
    </div>
  );
};

export default PageContent;
