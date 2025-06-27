import Link from "next/link"

export function EnvVarWarning() {
  return (
    <div className="flex gap-4 items-center">
      <div>
        Supabase environment variables required
      </div>
      <div>
        <button
          disabled
        >
          <Link href="/sign-in">Sign in</Link>
        </button>
        <button
          disabled
        >
          <Link href="/sign-up">Sign up</Link>
        </button>
      </div>
    </div>
  )
}
