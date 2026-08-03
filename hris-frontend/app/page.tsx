// app/login/page.tsx
import { redirect } from 'next/navigation'

export default function Page() {
    // Redirect legacy /login to new /modules/login route
    redirect('/modules/login')
}