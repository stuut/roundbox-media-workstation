export function FormMessage({ message }) {
  return (
    <div className="flex flex-col gap-2 w-full max-w-md text-sm">
      {"success" in message && (
        <div className="alert alert-success">
          {message.success}
        </div>
      )}
      {"error" in message && (
        <div className="alert alert-danger">
          {message.error}
        </div>
      )}
      {"message" in message && (
        <div className="alert">{message.message}</div>
      )}

    </div>
  )
}
