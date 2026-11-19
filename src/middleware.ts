export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/products/:path*",
    "/categories/:path*",
    "/stock-in/:path*",
    "/stock-out/:path*",
    "/stock-adjustments/:path*",
    "/stock-history/:path*",
    "/suppliers/:path*",
    "/warehouses/:path*",
    "/reports/:path*",
    "/users/:path*",
    "/settings/:path*",
  ],
};
