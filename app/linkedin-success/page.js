'use client';
import { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function LinkedInSuccessInner() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  useEffect(() => {
    if (token) {
      localStorage.setItem('linkedin_token', token);
    }
  }, [token]);

  return (
    <div>
      <h1>LinkedIn Connected!</h1>
      <p>Your token has been stored in localStorage.</p>
    </div>
  );
}

// This is your actual page component
export default function LinkedInSuccessPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LinkedInSuccessInner />
    </Suspense>
  );
}
