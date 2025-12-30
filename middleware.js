import { NextResponse } from 'next/server';

export function middleware(request) {
    const { pathname } = request.nextUrl;

    // Paths that require authentication
    const protectedPaths = ['/admin', '/admin/leaderboard'];

    // Check if current path is protected and NOT the login page itself
    const isProtected = protectedPaths.some(path => pathname === path || pathname.startsWith(path + '/')) && pathname !== '/admin/login';

    if (isProtected) {
        const session = request.cookies.get('admin_session');

        if (!session || session.value !== 'authenticated') {
            const url = new URL('/admin/login', request.url);
            return NextResponse.redirect(url);
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/admin/:path*', '/admin'],
};
