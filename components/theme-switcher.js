"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export const ThemeSwitcher = () => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Wait until mounted on the client to prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div style={{display:'flex', justifyContent: 'start', padding:'10px'}}>
      <div onClick={() => setTheme("dark")}>
        <svg
          className="theme-icon"
          viewBox="0 0 24 24"
          fill={theme==='dark'?"var(--md-sys-color-primary)":"var(--md-sys-color-surface-container)"}
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M12,21c-2.5,0-4.6-0.9-6.4-2.6S3,14.5,3,12s0.9-4.6,2.6-6.4S9.5,3,12,3c0.2,0,0.5,0,0.7,0c0.2,0,0.4,0,0.7,0.1
	c-0.7,0.5-1.2,1.1-1.6,1.9c-0.4,0.8-0.6,1.6-0.6,2.5c0,1.5,0.5,2.8,1.6,3.8s2.3,1.6,3.8,1.6c0.9,0,1.8-0.2,2.5-0.6
	c0.8-0.4,1.4-1,1.9-1.6c0,0.2,0.1,0.4,0.1,0.7c0,0.2,0,0.5,0,0.7c0,2.5-0.9,4.6-2.6,6.4S14.5,21,12,21z M12,19
	c1.5,0,2.8-0.4,3.9-1.2c1.2-0.8,2-1.9,2.6-3.2c-0.3,0.1-0.7,0.1-1,0.2c-0.3,0.1-0.7,0.1-1,0.1c-2.1,0-3.8-0.7-5.2-2.2
	S9.1,9.5,9.1,7.5c0-0.3,0-0.7,0.1-1c0.1-0.3,0.1-0.7,0.2-1C8.1,6,7,6.9,6.2,8S5,10.5,5,12c0,1.9,0.7,3.6,2.1,5S10.1,19,12,19z" fill="inherit" />
        </svg>
      </div>
      <div onClick={() => setTheme("light")}>
        <svg className="theme-icon" viewBox="0 0 24 24" fill={theme==='light'?"var(--md-sys-color-primary)":"var(--md-sys-color-surface-container)"} xmlns="http://www.w3.org/2000/svg">
          <path d="M12,15c0.8,0,1.5-0.3,2.1-0.9c0.6-0.6,0.9-1.3,0.9-2.1s-0.3-1.5-0.9-2.1S12.8,9,12,9s-1.5,0.3-2.1,0.9
            C9.3,10.5,9,11.2,9,12s0.3,1.5,0.9,2.1C10.5,14.7,11.2,15,12,15z M12,17c-1.4,0-2.6-0.5-3.5-1.5c-1-1-1.5-2.2-1.5-3.5
            s0.5-2.6,1.5-3.5S10.6,7,12,7s2.6,0.5,3.5,1.5S17,10.6,17,12s-0.5,2.6-1.5,3.5C14.6,16.5,13.4,17,12,17z M5,13H1v-2h4V13z M23,13h-4
            v-2h4V13z M11,5V1h2v4H11z M11,23v-4h2v4H11z M6.4,7.7L3.9,5.3l1.4-1.5l2.4,2.5L6.4,7.7z M18.7,20.1l-2.4-2.5l1.3-1.4l2.5,2.4
            L18.7,20.1z M16.2,6.4l2.4-2.5l1.5,1.4l-2.5,2.4L16.2,6.4z M3.9,18.7l2.5-2.4l1.4,1.3l-2.4,2.5L3.9,18.7z"/>
        </svg>
      </div>
    </div>
  );
};
