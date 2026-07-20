import { useState, useEffect, useRef } from "react";
  import {ChevronDown} from "lucide-react";

export default function Dropdown({placeholder = "Select...", children, icon, style, width }) {
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

    const Icon = icon
    const widthStyle = width
  return (

  
    <div ref={dropdownRef} style={{ position: "relative" }}>
      <button
        className={`btn ${style} icon-button`}
        onClick={() => setIsOpen(!isOpen)}
        style={{ display:'flex', alignItems: 'center', width: "100%", padding: "10px", textAlign: "left", cursor: "pointer" }}
      >
        {icon&&
          <Icon className='button-icon'/>
        }
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
          minWidth: '200px',
          width: widthStyle?`${widthStyle}px` : '100%'
        }} className='dropshadow'>
          <div onClick={() => setIsOpen(false)}>
            {children}
          </div>
        </div>
      )}
    </div>
  );
}
