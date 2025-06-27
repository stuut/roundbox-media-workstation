import { signInAction } from "@/app/actions"
import { FormMessage } from "@/components/form-message"
import { SubmitButton } from "@/components/submit-button"
import Link from "next/link"

export default async function Login(props) {
  const searchParams = await props.searchParams
  return (
    <div className='card' style={{
      minWidth:'600px',
      top:'50%',
      left:'50%',
      transform:'translate(-50%, -50%)',
      position:'absolute',
    }}>
      <form>
        <h1>Sign in</h1>
        <p>
          Don't have an account?{" "}
          <Link href="/sign-up">
            Sign up
          </Link>
        </p>
        <div>
          <label htmlFor="email">Email</label>
          <input className="form-input" name="email" placeholder="you@example.com" required />
          <div>
            <label htmlFor="password">Password</label>
            <Link style={{fontSize:'.7em', marginLeft:'10px'}}href="/forgot-password">Forgot Password?</Link>
          </div>
          <input
            className="form-input"
            type="password"
            name="password"
            placeholder="Your password"
            required
          />
          <SubmitButton pendingText="Signing In..." formAction={signInAction}>
            Sign in
          </SubmitButton>
          <FormMessage message={searchParams} />
        </div>
      </form>
  </div>
  )
}
