import React from 'react';
import MarkdownEditor from '@uiw/react-markdown-editor';
import { EditorView } from '@codemirror/view';

// Import ReactMde dynamically to prevent SSR issues

const MarkdownEditorComponent = ({ value, onChange, selectedTab, onTabChange }) => {

  console.log('MarkdownEditor', value)

  return (
    <div>
      <MarkdownEditor
        value={value}
        onChange={onChange}
        previewWidth="80%" 
        reExtensions={[EditorView.lineWrapping]}

      />
    </div>
  );
};

export default MarkdownEditorComponent;
