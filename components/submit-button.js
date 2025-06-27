"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton({
  children,
  pendingText = "Submitting...",
  ...props
}) {
  const { pending } = useFormStatus();

  return (
    <button className="btn primary" type="submit" aria-disabled={pending} {...props}>
      {pending ? pendingText : children}
    </button>
  );
}
