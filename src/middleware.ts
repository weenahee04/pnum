import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login",
  },
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/checkin/:path*",
    "/leave/:path*",
    "/attendance/:path*",
    "/reports/:path*",
    "/payroll/:path*",
    "/recruitment/:path*",
    "/training/:path*",
    "/evaluation/:path*",
    "/surveys/:path*",
    "/kpi/:path*",
    "/admin/:path*",
    "/profile/:path*",
    "/line-notify/:path*",
    "/seo/:path*",
  ],
};
