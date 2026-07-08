'use client'


import {useState, useRef, useEffect} from 'react'




export const FontDropdown = ({placeholder = "Select...", children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close the dropdown if the user clicks outside of it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);


  return (
    <div ref={dropdownRef} style={{ position: "relative" }}>
      <button
        className="form-input select font-button"
        onClick={() => setIsOpen(!isOpen)}
        style={{ width: "100%", textAlign: "left", cursor: "pointer" }}
      >
        <p style={{fontFamily:placeholder, margin:0, cursor: "pointer"}} className="no-highlight">{placeholder}</p>
      </button>

      {isOpen && (
        <div style={{
          position:'absolute',
          marginTop: '0px',
          zIndex: '100',
          background: 'var(--md-sys-color-surface)',
          borderRadius:'var(--input-border-radius)',
          padding:'10px',
          left: '0px',
          minWidth: '220px'
        }} className='dropshadow'>
          <div onClick={() => setIsOpen(false)}>
            {children}
          </div>
        </div>
      )}
    </div>
  );
}
