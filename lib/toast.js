'use client';

import { toast, Slide } from 'react-toastify';

export const showSuccess = (msg) => toast.success(msg, {
  position: "bottom-left",
  autoClose: 5000,
  theme:'dark',
  transition: Slide,
  hideProgressBar: true,
  closeOnClick: true,
  pauseOnHover: true,
});

export const showError = (msg) => toast.error(msg, {
  position: "bottom-left",
  autoClose: 5000,
  theme:'dark',
  transition: Slide,
  hideProgressBar: true,
  closeOnClick: true,
  pauseOnHover: true,
});

export const showInfo = (htmlString) => {
  toast.info(
    <div dangerouslySetInnerHTML={{ __html: htmlString }} />,
    {
      autoClose: false,   
      position: 'top-right',
      theme: 'dark',
      transition: Slide,
      hideProgressBar: true,
      closeOnClick: true,
      pauseOnHover: true,
    }
  );
};
