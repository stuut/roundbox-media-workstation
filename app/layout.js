import { EnvVarWarning } from "@/components/env-var-warning"
import HeaderAuth from "@/components/header-auth"
import { ThemeSwitcher } from "@/components/theme-switcher"
import { hasEnvVars } from "@/utils/supabase/check-env-vars"
import { Poppins } from "next/font/google"
import { ThemeProvider } from "next-themes"
import Link from "next/link"
import { TaskProvider } from '@/context/task-context'
import { UserProvider } from '@/context/user-context'
import { FilesProvider } from '@/context/files-context'
import MyFiles from "@/components/my-files"
import UserChat from "@/components/user-chat"
import ToastProvider from "@/components/toast-provider"


import "./globals.css"
import "./theme.css"

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3001"

export const metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Next.js and Supabase Starter Kit",
  description: "The fastest way to build apps with Next.js and Supabase"
}

const poppins = Poppins({
  weight: ['300', '400', '700'],
  variable: "--font-poppins",
  subsets: ["latin"],
});

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${poppins.variable}`} suppressHydrationWarning>
      <body className="bg-background text-foreground">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
        >
        <UserProvider>
          <FilesProvider>
          <TaskProvider>
          <ToastProvider/>
            <main>
              <div>
                <nav>
                  <div>
                    {!hasEnvVars ? <EnvVarWarning /> : <HeaderAuth />}
                  </div>
                </nav>
                <MyFiles/>
                <div>
                  {children}
                </div>
                <UserChat/>
                <footer style={{clear: 'left'}}>
                  <ThemeSwitcher />
                </footer>
              </div>
            </main>
          </TaskProvider>
        </FilesProvider>
      </UserProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
