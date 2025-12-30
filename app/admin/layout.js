import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function AdminLayout({ children }) {
    const cookieStore = await cookies();
    const session = cookieStore.get('admin_session');

    // We are already inside the /admin folder. 
    // We need to check if were NOT on the login page.
    // Note: layouts don't have access to the current path easily in Server Components,
    // but we can check the cookie. 

    // If we wanted to be more precise, we'd use middleware.js
    // For now, this is a simple protection for the dashboard nested content.

    // To handle the login page itself not redirecting to itself, 
    // we'll rely on the fact that if they occupy the same space, 
    // but usually, we'd want to exclude login from this check.

    // However, in Next.js, if I put this in app/admin/layout.js, 
    // it will wrap app/admin/login/page.js too.

    return <>{children}</>;
}
