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
    <Link className={pagePath==="/my-tasks"?'active':null} style={{marginRight:'10px'}} href='/my-tasks'>My Tasks</Link>
  </div>
)

}
