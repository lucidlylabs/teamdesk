export { default } from "next-auth/middleware";

export const config = {
  matcher: ["/team/:path*", "/desk/:path*", "/api/attendance/:path*", "/api/research/:path*"],
};
