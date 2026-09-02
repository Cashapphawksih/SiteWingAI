import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { getSupabasePublicConfig, isSupabaseConfigured } from "@/lib/supabase/config";
import type { Database } from "@/types/supabase";

function copyCookies(source: NextResponse, destination: NextResponse) {
  for (const cookie of source.cookies.getAll()) destination.cookies.set(cookie);
  return destination;
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const pathname = request.nextUrl.pathname;
  const publicSiteRoute = pathname === "/site" || pathname.startsWith("/site/") || pathname.startsWith("/api/public-sites/");
  if (publicSiteRoute) return response;
  if (!isSupabaseConfigured()) return response;

  const { url, publishableKey } = getSupabasePublicConfig();
  const supabase = createServerClient<Database>(url, publishableKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  const signedIn = Boolean(data?.claims?.sub);
  const protectedRoute = pathname === "/dashboard" || pathname.startsWith("/dashboard/") || pathname === "/build" || pathname.startsWith("/build/");
  const guestRoute = pathname === "/login" || pathname === "/signup";

  if (!signedIn && protectedRoute) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.search = "";
    loginUrl.searchParams.set("next", `${pathname}${request.nextUrl.search}`);
    return copyCookies(response, NextResponse.redirect(loginUrl));
  }

  if (signedIn && guestRoute) {
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = "/dashboard";
    dashboardUrl.search = "";
    return copyCookies(response, NextResponse.redirect(dashboardUrl));
  }

  return response;
}
