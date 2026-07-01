import React from 'react';
import MarkdownEditor from '@uiw/react-markdown-editor';

// Import ReactMde dynamically to prevent SSR issues

const MarkdownEditorComponent = ({ value, onChange, selectedTab, onTabChange }) => {

  console.log('MarkdownEditor', value)

  return (
    <div>
      <MarkdownEditor
        value={value}
        onChange={onChange} // Ensure onChange is bound to the correct handler
      />
    </div>
  );
};

export default MarkdownEditorComponent;
