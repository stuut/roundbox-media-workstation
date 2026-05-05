"use client";
import Link from "next/link"
import { usePathname } from 'next/navigation';



export default function AccountMenu(){
  const pagePath = usePathname();

  console.log('pagePath', pagePath)

return(
  <div className="header-links">
    <div style={{padding:'5px 0px'}}>
      <Link className={pagePath==="/account/my-details"?'active':null} style={{marginleft:'10px'}} href='/account/my-details'>My Details</Link>
    </div>
    <div style={{padding:'5px 0px'}}>
      <Link className={pagePath==="/account/notifications"?'active':null} style={{marginleft:'10px'}} href='/account/notifications'>Notifications</Link>
    </div>
    <div style={{padding:'5px 0px'}}>
      <Link className={pagePath==="/account/facebook"?'active':null} style={{marginleft:'10px'}} href='/account/facebook'>Facebook</Link>
    </div>
    <div style={{padding:'5px 0px'}}>
      <Link className={pagePath==="/account/channels"?'active':null} style={{marginleft:'10px'}} href='/account/channels'>Channels</Link>
    </div>
  </div>
)


}
