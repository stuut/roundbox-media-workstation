import React, { useState, useEffect, useRef } from 'react';

const DropdownBuilder = ({ defaultTags, placeholder = 'Add a menu item...', callback }) => {
  const [input, setInput] = useState('');
  const [tags, setTags] = useState([]);
  const dragItem = useRef(null);
  const dragOverItem = useRef(null);

  const priorityOptions = ["low", "medium", "high", "critical"]

  const preconfigured = (type) => {
    if (type === 'priority'){
      setTags(priorityOptions)
    }
  }

  useEffect(() => {
    if (defaultTags){
      setTags(defaultTags)
    }
  }, [defaultTags]);

  useEffect(() => {
    if (tags){
      callback(tags)
    }
  }, [tags]);


  const handleKeyDown = (e) => {
    if ((e.key === 'Enter' || e.key === ',') && input.trim()) {
      e.preventDefault();
      const newTag = input.trim().replace(/,$/, '');
      if (!tags.includes(newTag)) {
        setTags([...tags, newTag]);
      }
      setInput('');
    } else if (e.key === 'Backspace' && !input) {
      setTags(tags.slice(0, -1));
    }
  };

  const removeTag = (index) => {
    setTags(tags.filter((_, i) => i !== index));
  };


  const handleDragStart = (index) => {
    dragItem.current = index;
  };

const handleDragEnter = (index) => {
  dragOverItem.current = index;
};

const handleDrop = () => {
  const fromIndex = dragItem.current;
  const toIndex = dragOverItem.current;

  if (fromIndex === null || toIndex === null || fromIndex === toIndex) return;

  const updatedTags = [...tags];
  const draggedItem = updatedTags.splice(fromIndex, 1)[0];
  updatedTags.splice(toIndex, 0, draggedItem);

  setTags(updatedTags);

  dragItem.current = null;
  dragOverItem.current = null;
};

  return (
    <div>
      <div style={styles.container}>
          {tags.map((tag, index) => (
            <div
              key={index}
              style={styles.tag}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragEnter={() => handleDragEnter(index)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
            >
              {tag}
              <button type="button" onClick={() => removeTag(index)} style={styles.button}>
                &times;
              </button>
            </div>
          ))}

        <input
          className='form-input'
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
        />

      </div>
      <p style={{display:'block', fontSize:'.8em', margin: '0px'}}> Templates </p>
      <button type="button" onClick={() => preconfigured('priority')} className='btn btn-sm secondary'>Priority</button>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexWrap: 'wrap',
    padding: '6px',
    minHeight: '40px',
  },
  tag: {
    display: 'flex',
    alignItems: 'center',
    background: 'var(--md-sys-color-surface-dim)',
    borderRadius: 'var(--btn-border-radius)',
    padding: '4px 8px',
    margin: '2px',
    fontSize:'.8em'
  },
  button: {
    background: 'none',
    border: 'none',
    marginLeft: '6px',
    cursor: 'pointer',
    fontSize: '16px',
    lineHeight: '1',
  },
  input: {
    flex: '1',
    border: 'none',
    outline: 'none',
    minWidth: '120px',
    margin: '2px',
  },
};

export default DropdownBuilder;
