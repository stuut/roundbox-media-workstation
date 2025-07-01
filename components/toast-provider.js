// app/components/ToastProvider.tsx
'use client';

import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import "@/app/toast.css"

export default function ToastProvider() {
  return (
    <ToastContainer/>
  );
}
