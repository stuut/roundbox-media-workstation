'use client';

import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  components: {
    MuiSlider: {
      styleOverrides: {
        root: {
          color: 'var(--md-sys-color-primary)', // Overall base color
        },
        thumb: {
          backgroundColor: 'var(--md-sys-color-primary)', // Color of the draggable knob
        },
        track: {
          backgroundColor: 'var(--md-sys-color-primary)', // Color of the filled part
          height:'8px'
        },
        rail: {
          backgroundColor: 'var(--md-sys-color-outline-variant)', // Color of the unfilled part
          height:'8px'
        },
      },
    },
    MuiRadio: {
      styleOverrides: {
        // Targets the base Radio component
        root: {
          color: 'var(--md-sys-color-outline)', // default color
          '&.Mui-checked': {
            color: 'var(--md-sys-color-primary)', // color when selected
          },
        },
        // Targets the primary color variant specifically
        colorPrimary: {
          '&:hover': {
            backgroundColor: 'rgba(54, 94, 157, 0.04)',
          },
        },
      },
    },
    MuiSwitch: {
      styleOverrides: {
        switchBase: {
          color: 'var(--md-sys-color-secondary)',

          '&.Mui-checked': {
            color: 'var(--md-sys-color-primary)',
          },

          '&.Mui-checked + .MuiSwitch-track': {
            backgroundColor: 'var(--md-sys-color-primary-container) !important',
            opacity: 1,
          },
        },

        track: {
          backgroundColor: 'var(--md-sys-color-surface-container)',
          opacity: 1,
        },
      },
    },
  },
});

export default theme;
