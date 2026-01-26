import { withSentryConfig } from "@sentry/nextjs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Custom loader for visual edits
const LOADER = path.resolve(__dirname, "src/visual-edits/component-tagger-loader.js");

const nextConfig = {
    // Ensure Vercel builds in standalone mode
    output: "standalone",

    // Fix workspace root warning - set to current project directory
    outputFileTracingRoot: path.resolve(__dirname),

    // Image optimization for all http/https hosts
    images: {
        remotePatterns: [
            { protocol: "https", hostname: "**" },
            { protocol: "http", hostname: "**" },
        ],
    },

    // Enable custom turbopack loader only when explicitly requested (dev visual edits tooling)
    ...(process.env.ENABLE_VISUAL_EDITS === 'true' ? {
        turbopack: {
            rules: {
                "*.{jsx,tsx}": {
                    loaders: [LOADER],
                },
            },
        },
    } : {}),

    // Strip console logs in production (except warn + error)
    compiler: {
        removeConsole:
            process.env.NODE_ENV === "production"
                ? { exclude: ["error", "warn"] }
                : false,
    },

    // Enable gzip compression
    compress: true,

    // Optimize certain imports
    experimental: {
        optimizePackageImports: ["lucide-react", "@radix-ui/react-icons"],
    },

    // Security + SSE headers
    async headers() {
        return [
            {
                source: "/api/sse/:path*",
                headers: [
                    { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
                    { key: "Connection", value: "keep-alive" },
                    { key: "Content-Type", value: "text/event-stream" },
                    { key: "X-Accel-Buffering", value: "no" },
                ],
            },
            {
                source: "/:path*",
                headers: [
                    // Prevent XSS attacks
                    { key: "X-Frame-Options", value: "DENY" },
                    { key: "X-Content-Type-Options", value: "nosniff" },
                    { key: "X-XSS-Protection", value: "1; mode=block" },

                    // Referrer policy
                    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },

                    // Strict Transport Security (HTTPS only)
                    { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains; preload" },

                    // Content Security Policy
                    {
                        key: "Content-Security-Policy",
                        value: [
                            "default-src 'self'",
                            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live https://vitals.vercel-analytics.com https://slelguoygbfzlpylpxfs.supabase.co https://va.vercel-scripts.com",
                            "style-src 'self' 'unsafe-inline'",
                            "img-src 'self' data: https:",
                            "font-src 'self' data:",
                            "connect-src 'self' https://vercel.live wss://vercel.live https://vitals.vercel-analytics.com https://slelguoygbfzlpylpxfs.supabase.co https://va.vercel-scripts.com",
                            "media-src 'self'",
                            "object-src 'none'",
                            "base-uri 'self'",
                            "form-action 'self'",
                            "frame-ancestors 'none'",
                            "upgrade-insecure-requests"
                        ].join("; ")
                    },

                    // Permissions Policy (Feature Policy)
                    {
                        key: "Permissions-Policy",
                        value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()"
                    },
                ],
            },
        ];
    },
};

export default withSentryConfig(nextConfig, {
    // For all available options, see:
    // https://www.npmjs.com/package/@sentry/webpack-plugin#options

    org: "edic-tcet",

    project: "javascript-nextjs",

    // Only print logs for uploading source maps in CI
    silent: !process.env.CI,

    // For all available options, see:
    // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

    // Upload a larger set of source maps for prettier stack traces (increases build time)
    widenClientFileUpload: true,

    // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
    // This can increase your server load as well as your hosting bill.
    // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
    // side errors will fail.
    tunnelRoute: "/monitoring",

    // Automatically tree-shake Sentry logger statements to reduce bundle size
    disableLogger: true,

    // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
    // See the following for more information:
    // https://docs.sentry.io/product/crons/
    // https://vercel.com/docs/cron-jobs
    automaticVercelMonitors: true,
});
