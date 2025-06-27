import { signUpAction } from "@/app/actions"
import { FormMessage } from "@/components/form-message"
import { SubmitButton } from "@/components/submit-button"
import Link from "next/link"
import { SmtpMessage } from "../smtp-message"

export default async function Signup(props) {
  const searchParams = await props.searchParams
  if ("message" in searchParams) {
    return (
      <div>
        <FormMessage message={searchParams} />
      </div>
    )
  }

  return (
    <div className='card center-relative' style={{
      minWidth:'600px',
      top:'50%',
      left:'50%',
      transform:'translate(-50%, -50%)',
      position:'absolute',
    }}>
      <form>
        <h1>Sign up</h1>
        <p>
          Already have an account?{" "}
          <Link href="/sign-in">
            Sign in
          </Link>
        </p>
        <div>
          <label htmlFor="email">Email</label>
          <input className="form-input" name="email" placeholder="you@example.com" required />
          <label htmlFor="password">Password</label>
          <input
            className="form-input"
            type="password"
            name="password"
            placeholder="Your password"
            minLength={6}
            required
          />
          <SubmitButton formAction={signUpAction} pendingText="Signing up...">
            Sign up
          </SubmitButton>
          <FormMessage message={searchParams} />
        </div>
      </form>
      <SmtpMessage />
    </div>
  )
}
