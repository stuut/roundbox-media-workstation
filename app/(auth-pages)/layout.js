export default async function Layout({ children }) {
  return (
    <div className="max-w-7xl flex flex-col gap-12 items-start">{children}</div>
  )
}
