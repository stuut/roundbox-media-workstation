import { EnvVarWarning } from "@/components/env-var-warning"
import HeaderAuth from "@/components/header-auth"
import { ThemeSwitcher } from "@/components/theme-switcher"
import { hasEnvVars } from "@/utils/supabase/check-env-vars"
import { ThemeProvider } from "next-themes"
import Link from "next/link"
import { ItemProvider } from '@/context/item-context'
import { EditItemProvider } from '@/context/edit-item-context'
import { UserProvider } from '@/context/user-context'
import { FilesProvider } from '@/context/files-context'
import { AIProvider } from '@/context/ai-context'
import AISideBar from "@/components/ai-sidebar"
import MyFiles from "@/components/my-files"
import UserChat from "@/components/user-chat"
import ToastProvider from "@/components/toast-provider"
import ImportItems from "@/components/import-items"
import EditFile from "@/components/edit-item"
import { Poppins } from "next/font/google"
import { Raleway } from 'next/font/google';


const raleway = Raleway({
     weight: ['100', '200', '300', '400', '700', '800', '900'], // Specify desired weights
     style: ['italic','normal'],
     variable: "--font-raleway",
     subsets: ['latin'],    // Define required subsets
     display: 'swap',       // Recommended for better font loading behavior
});

const poppins = Poppins({
  weight: ['100', '200', '300', '400', '700', '800', '900'],
  style: ['italic','normal'],
  variable: "--font-poppins",
  subsets: ["latin"],
});



import "./globals.css"
import "./theme.css"

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3001"

export const metadata = {
  metadataBase: new URL(defaultUrl),
  title: "RoundBox Media Task Manager",
  description: "RoundBox Media Task Manager"
}



export default async function RootLayout({ children, params  }) {

  if (params.slug === 'canvas-design-system') {
    return (
    <html lang="en" className={`${poppins.variable} ${raleway.variable}`} suppressHydrationWarning>
        <body className="bg-background text-foreground">
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
          >
          <UserProvider>
          <FilesProvider>
            <main className="full-height">
              <div style={{height:'100%'}}>
                {children}
              </div>
            </main>
          </FilesProvider>
        </UserProvider>
        </ThemeProvider>
      </body>
    </html>
    )
  }else{

  return (
    <html lang="en" className={`${poppins.variable} ${raleway.variable}`} suppressHydrationWarning>
      <body className="bg-background text-foreground">
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.fbAsyncInit = function() {
                FB.init({
                  appId      : '2837257096522631',
                  cookie     : true,
                  xfbml      : true,
                  version    : 'v22.0'
                });

                FB.AppEvents.logPageView();
              };

              (function(d, s, id){
                 var js, fjs = d.getElementsByTagName(s)[0];
                 if (d.getElementById(id)) {return;}
                 js = d.createElement(s); js.id = id;
                 js.src = "https://connect.facebook.net/en_US/sdk.js";
                 fjs.parentNode.insertBefore(js, fjs);
               }(document, 'script', 'facebook-jssdk'));

            `,
          }}
        />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
        >
        <UserProvider>
          <EditItemProvider>
          <FilesProvider>
          <AIProvider>
          <ItemProvider>
          <ToastProvider/>
            <main className="full-height">
              <div style={{height:'100%', position:'relative'}}>
                  <nav>
                    <div>
                      {!hasEnvVars ? <EnvVarWarning /> : <HeaderAuth />}
                    </div>
                  </nav>

                <ImportItems/>
                <div style={{height: 'calc(100% - 71.5px)'}}>
                  {children}
                </div>
                <MyFiles/>
                <EditFile/>
                <AISideBar/>
                <UserChat/>
              </div>
            </main>
          </ItemProvider>
        </AIProvider>
        </FilesProvider>
      </EditItemProvider>
      </UserProvider>
        </ThemeProvider>
      </body>
    </html>
  )
  }
}
