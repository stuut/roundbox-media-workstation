import { useState, useEffect, useRef } from "react";
  import {ChevronDown} from "lucide-react";

export default function Dropdown({placeholder = "Select...", children }) {
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
        className="btn primary"
        onClick={() => setIsOpen(!isOpen)}
        style={{ display:'flex', alignItems: 'center', width: "100%", padding: "10px", textAlign: "left", cursor: "pointer" }}
      >
        {placeholder}
         
        <ChevronDown style={{ marginLeft: 'auto' }}/>
      </button>

      {isOpen && (
        <div style={{
          position:'absolute',
          marginTop: '0px',
          zIndex: '100',
          backgroundColor: 'var(--md-sys-color-surface)',
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
