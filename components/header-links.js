"use client";
import Link from "next/link"
import { usePathname } from 'next/navigation';

export default function HeaderLinks() {
  const pagePath = usePathname();


return(
  <div className='header-links'>
    <Link className={pagePath==="/dashboard"?'active':null} style={{marginRight:'10px'}} href='/dashboard'>Dashboard</Link>
    <Link className={pagePath==="/my-workspaces"?'active':null} style={{marginRight:'10px'}} href='/my-workspaces'>My Workspaces</Link>
    <Link className={pagePath==="/my-boards"?'active':null} style={{marginRight:'10px'}} href='/my-boards'>My Boards</Link>
    <Link className={pagePath==="/my-items"?'active':null} style={{marginRight:'10px'}} href='/my-items'>My Items</Link>
    <Link className={pagePath==="/my-media"?'active':null} style={{marginRight:'10px'}} href='/my-media'>My Media</Link>
    <Link className={pagePath==="/canvas-design-system"?'active':null} style={{marginRight:'10px'}} href='/canvas-design-system'>Design</Link>
    <Link className={pagePath==="/schedule"?'active':null} style={{marginRight:'10px'}} href='/schedule'>Schedule</Link>
    <Link className={pagePath==="/qr-code"?'active':null} style={{marginRight:'10px'}} href='/qr-code'>QR Code</Link>
    <Link className={pagePath==="/extract-text"?'active':null} style={{marginRight:'10px'}} href='/extract-text'>Extract Text</Link>

  </div>
)

}
