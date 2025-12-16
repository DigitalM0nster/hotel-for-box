import { auth } from "./auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
    const session = await auth(); // auth работает без mongoose

    const isAdminRoute = req.nextUrl.pathname.startsWith("/admin");
    const isUserRoute = req.nextUrl.pathname.startsWith("/user");

    if (!session && (isAdminRoute || isUserRoute)) {
        return NextResponse.redirect(new URL("/login", req.url));
    }

    if (isAdminRoute && session?.user.role !== "admin" && session?.user.role !== "super") {
        return NextResponse.redirect(new URL("/user", req.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/admin/:path*", "/user/:path*"],
};
