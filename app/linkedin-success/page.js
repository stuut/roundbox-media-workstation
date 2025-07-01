'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function LinkedInSuccess() {
  const router = useRouter();
  const { token } = router.query;

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
