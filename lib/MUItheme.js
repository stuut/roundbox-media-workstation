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
    MuiButton: {
      styleOverrides: {
        containedPrimary: {
          backgroundColor: 'var(--md-sys-color-primary)',
          color: 'var(--md-sys-color-on-primary)',

          '&:hover': {
            backgroundColor: 'var(--md-sys-color-primary)',
            filter: 'brightness(0.95)',
          },
        },

        outlinedPrimary: {
          borderColor: 'var(--md-sys-color-outline)',
          color: 'var(--md-sys-color-primary)',
        },
      },
    },

    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: 'var(--md-sys-color-surface)',
          color: 'var(--md-sys-color-on-surface)',
        },
      },
    },

    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: 'var(--md-sys-color-surface)',
        },
      },
    },
  },
});

export default theme;
