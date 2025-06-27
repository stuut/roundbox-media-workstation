import { forgotPasswordAction } from "@/app/actions"
import { FormMessage } from "@/components/form-message"
import { SubmitButton } from "@/components/submit-button"
import Link from "next/link"
import { SmtpMessage } from "../smtp-message"

export default async function ForgotPassword(props) {
  const searchParams = await props.searchParams
  return (
    <div className='card center-relative' style={{
      minWidth:'600px',
      top:'50%',
      left:'50%',
      transform:'translate(-50%, -50%)',
      position:'absolute',
    }}>
      <form>
        <div>
          <h1>Reset Password</h1>
          <p>
            Already have an account?{" "}
            <Link href="/sign-in">
              Sign in
            </Link>
          </p>
        </div>
        <div>
          <label>Email</label>
          <input className="form-input" name="email" placeholder="you@example.com" required />
          <SubmitButton formAction={forgotPasswordAction}>
            Reset Password
          </SubmitButton>
          <FormMessage message={searchParams} />
        </div>
      </form>
      <SmtpMessage />
    </div>
  )
}
