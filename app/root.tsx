"use client";

import type { ReactElement } from "react";
import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";
import { AlertTriangle } from "lucide-react";

import type { Route } from "./+types/root";
import "./app.css";
import { logFrontendError } from "./utils/error-logger";
import { Card, CardContent } from "./components/ui/Card";
import { Button } from "./components/ui/Button";

/**
 * Inline fallback styles ensure the initial loading treatment is visible before
 * the main CSS bundle has been requested and applied.
 */
const HYDRATE_FALLBACK_INLINE_CSS = `
  @keyframes hydrate-sheet-drift {
    0%, 100% { transform: translate3d(0, 0, 0); }
    50% { transform: translate3d(0, 0.22rem, 0); }
  }

  @keyframes hydrate-sheet-settle {
    0%, 100% { transform: translate3d(0, 0, 0); }
    50% { transform: translate3d(0, -0.18rem, 0); }
  }

  @keyframes hydrate-line-scan {
    0% { transform: translateX(-138%); opacity: 0; }
    18% { opacity: 1; }
    62% { transform: translateX(138%); opacity: 1; }
    100% { transform: translateX(138%); opacity: 0; }
  }

  @keyframes hydrate-sheet-shimmer {
    0% { transform: translateX(-175%) skewX(-18deg); opacity: 0; }
    18% { opacity: 0.48; }
    56% { transform: translateX(180%) skewX(-18deg); opacity: 0.54; }
    100% { transform: translateX(180%) skewX(-18deg); opacity: 0; }
  }

  .hydrate-fallback {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    padding: 1rem;
  }

  .hydrate-fallback__stack {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.9rem;
    transform: translateY(-1.35rem);
  }

  .hydrate-loader {
    position: relative;
    display: grid;
    width: 9.5rem;
    height: 7.5rem;
    place-items: center;
  }

  .hydrate-loader__glow {
    position: absolute;
    inset: 0.75rem 0.95rem;
    background: radial-gradient(circle, rgba(94, 80, 57, 0.18) 0%, transparent 72%);
    filter: blur(24px);
  }

  .hydrate-loader__sheet {
    position: absolute;
    width: 6rem;
    height: 4.25rem;
    overflow: hidden;
    border: 1px solid rgba(195, 185, 172, 0.98);
    border-radius: 0.82rem;
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(247, 245, 243, 0.97) 100%);
    box-shadow:
      0 0 0 1px rgba(247, 245, 243, 0.88),
      0 18px 40px rgba(47, 43, 39, 0.11);
  }

  .hydrate-loader__sheet--back {
    transform: translate(-0.78rem, -0.5rem);
    opacity: 0.56;
    animation: hydrate-sheet-drift 2.8s ease-in-out infinite;
  }

  .hydrate-loader__sheet--middle {
    transform: translate(-0.2rem, -0.16rem);
    opacity: 0.82;
    animation: hydrate-sheet-settle 2.8s ease-in-out infinite;
  }

  .hydrate-loader__sheet--front {
    transform: translate(0.5rem, 0.32rem);
    border-color: rgba(179, 167, 152, 0.98);
    box-shadow:
      0 0 0 1px rgba(247, 245, 243, 0.92),
      0 26px 52px rgba(47, 43, 39, 0.13);
  }

  .hydrate-loader__eyebrow {
    position: absolute;
    top: 0.72rem;
    left: 0.94rem;
    width: 1.6rem;
    height: 0.28rem;
    border-radius: 999px;
    background: rgba(89, 76, 59, 0.9);
  }

  .hydrate-loader__rule {
    position: absolute;
    left: 0.94rem;
    right: 1.02rem;
    height: 2px;
    border-radius: 999px;
    background: rgba(47, 43, 39, 0.16);
  }

  .hydrate-loader__rule--primary {
    top: 1.42rem;
    right: 1.24rem;
    background: rgba(89, 76, 59, 0.64);
  }

  .hydrate-loader__rule--secondary {
    top: 2.08rem;
  }

  .hydrate-loader__rule--tertiary {
    top: 2.74rem;
    right: 1.46rem;
  }

  .hydrate-loader__shimmer {
    position: absolute;
    inset: 0;
    width: 54%;
    background: linear-gradient(
      90deg,
      transparent 0%,
      rgba(162, 138, 102, 0.05) 18%,
      rgba(255, 255, 255, 0.92) 50%,
      rgba(179, 152, 110, 0.22) 74%,
      transparent 100%
    );
    animation: hydrate-sheet-shimmer 1.9s cubic-bezier(0.4, 0, 0.2, 1) infinite;
  }

  .hydrate-loader__scan {
    position: absolute;
    top: 0.96rem;
    bottom: 0.82rem;
    width: 42%;
    background: linear-gradient(
      90deg,
      transparent 0%,
      rgba(89, 76, 59, 0.04) 12%,
      rgba(89, 76, 59, 0.24) 50%,
      rgba(89, 76, 59, 0.04) 88%,
      transparent 100%
    );
    animation: hydrate-line-scan 2.1s cubic-bezier(0.4, 0, 0.2, 1) infinite;
  }

  .hydrate-fallback__copy {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.3rem;
    text-align: center;
  }

  .hydrate-fallback__title {
    margin: 0;
    font-family: "Sora", ui-sans-serif, system-ui, sans-serif;
    font-size: 0.68rem;
    font-weight: 600;
    letter-spacing: 0.32em;
    text-transform: uppercase;
    color: rgba(47, 43, 39, 0.72);
  }

  .hydrate-fallback__caption {
    margin: 0;
    font-family: "Sora", ui-sans-serif, system-ui, sans-serif;
    font-size: 0.72rem;
    color: rgba(47, 43, 39, 0.62);
  }

  .hydrate-fallback__sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  .dark .hydrate-loader__glow {
    background: radial-gradient(circle, rgba(214, 177, 99, 0.2) 0%, transparent 72%);
  }

  .dark .hydrate-loader__sheet {
    border-color: rgba(77, 77, 84, 0.96);
    background: linear-gradient(180deg, rgba(41, 41, 46, 0.98) 0%, rgba(25, 25, 29, 0.97) 100%);
    box-shadow:
      0 0 0 1px rgba(24, 24, 27, 0.94),
      0 18px 40px rgba(0, 0, 0, 0.28);
  }

  .dark .hydrate-loader__sheet--front {
    border-color: rgba(97, 97, 104, 0.98);
    box-shadow:
      0 0 0 1px rgba(24, 24, 27, 0.98),
      0 26px 52px rgba(0, 0, 0, 0.34);
  }

  .dark .hydrate-loader__eyebrow {
    background: rgba(214, 177, 99, 0.92);
  }

  .dark .hydrate-loader__rule {
    background: rgba(242, 242, 242, 0.18);
  }

  .dark .hydrate-loader__rule--primary {
    background: rgba(214, 177, 99, 0.72);
  }

  .dark .hydrate-loader__shimmer {
    background: linear-gradient(
      90deg,
      transparent 0%,
      rgba(214, 177, 99, 0.04) 18%,
      rgba(255, 255, 255, 0.28) 50%,
      rgba(214, 177, 99, 0.34) 74%,
      transparent 100%
    );
  }

  .dark .hydrate-loader__scan {
    background: linear-gradient(
      90deg,
      transparent 0%,
      rgba(214, 177, 99, 0.04) 12%,
      rgba(214, 177, 99, 0.28) 50%,
      rgba(214, 177, 99, 0.04) 88%,
      transparent 100%
    );
  }

  .dark .hydrate-fallback__title {
    color: rgba(242, 242, 242, 0.76);
  }

  .dark .hydrate-fallback__caption {
    color: rgba(242, 242, 242, 0.62);
  }

  @media (max-width: 640px) {
    .hydrate-fallback__stack {
      transform: translateY(-0.9rem);
    }

    .hydrate-loader {
      width: 8.8rem;
      height: 7rem;
    }

    .hydrate-loader__sheet {
      width: 5.6rem;
      height: 4rem;
    }

    .hydrate-fallback__title,
    .hydrate-fallback__caption {
      max-width: 19rem;
    }
  }
`;

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap",
  },
];

export function Layout({
  children,
}: {
  children: React.ReactNode;
}): ReactElement {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <style
          id="hydrate-fallback-styles"
          dangerouslySetInnerHTML={{ __html: HYDRATE_FALLBACK_INLINE_CSS }}
        />
        <Links />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var storageKey = 'cohesiv_cpq_workspace';
                var mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

                function getThemeMode() {
                  try {
                    var rawWorkspace = window.localStorage.getItem(storageKey);
                    if (rawWorkspace) {
                      var parsedWorkspace = JSON.parse(rawWorkspace);
                      var persistedThemeMode = parsedWorkspace && parsedWorkspace.ui && parsedWorkspace.ui.theme_mode;
                      if (persistedThemeMode === 'dark' || persistedThemeMode === 'light') {
                        return persistedThemeMode;
                      }
                    }
                  } catch (error) {
                    // Ignore malformed localStorage payloads and fall back to system theme.
                  }

                  return mediaQuery.matches ? 'dark' : 'light';
                }

                function applyThemeMode(themeMode) {
                  document.documentElement.classList.toggle('dark', themeMode === 'dark');
                  document.documentElement.style.colorScheme = themeMode;
                  document.documentElement.style.backgroundColor = themeMode === 'dark'
                    ? 'hsl(240 6% 10%)'
                    : 'hsl(36 20% 96%)';
                  document.documentElement.style.color = themeMode === 'dark'
                    ? 'hsl(0 0% 95%)'
                    : 'hsl(28 9% 17%)';
                }

                applyThemeMode(getThemeMode());

                mediaQuery.addEventListener('change', function() {
                  applyThemeMode(getThemeMode());
                });

                window.addEventListener('storage', function(event) {
                  if (event.key === storageKey) {
                    applyThemeMode(getThemeMode());
                  }
                });
              })();
            `,
          }}
        />
      </head>
      <body className="bg-background text-foreground antialiased">
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

/**
 * HydrateFallback - Required for SPA mode
 * This is rendered during the initial page load while the app hydrates.
 */
export function HydrateFallback(): ReactElement {
  return (
    <div className="hydrate-fallback">
      <div className="hydrate-fallback__stack">
        <div
          role="status"
          aria-live="polite"
          data-slot="hydrate-loader"
          className="hydrate-loader"
        >
          {/**
           * The shell uses a restrained document-style loader so the initial
           * hydration state feels consistent with the rest of the layout.
           */}
          <div aria-hidden="true" className="hydrate-loader__glow" />
          <div
            aria-hidden="true"
            className="hydrate-loader__sheet hydrate-loader__sheet--back"
          />
          <div
            aria-hidden="true"
            className="hydrate-loader__sheet hydrate-loader__sheet--middle"
          />
          <div
            aria-hidden="true"
            className="hydrate-loader__sheet hydrate-loader__sheet--front"
          >
            <div className="hydrate-loader__eyebrow" />
            <div className="hydrate-loader__rule hydrate-loader__rule--primary" />
            <div className="hydrate-loader__rule hydrate-loader__rule--secondary" />
            <div className="hydrate-loader__rule hydrate-loader__rule--tertiary" />
            <div
              data-slot="hydrate-loader-shimmer"
              className="hydrate-loader__shimmer"
            />
            <div className="hydrate-loader__scan" />
          </div>
          <span className="hydrate-fallback__sr-only">Loading application</span>
        </div>
        <div className="hydrate-fallback__copy">
          <p data-slot="hydrate-loader-title" className="hydrate-fallback__title">
            Preparing shell
          </p>
          <p
            data-slot="hydrate-loader-caption"
            className="hydrate-fallback__caption"
          >
            Syncing layout and workflow state
          </p>
        </div>
      </div>
    </div>
  );
}

export default function App(): ReactElement {
  return <Outlet />;
}

export function ErrorBoundary({
  error,
}: Route.ErrorBoundaryProps): ReactElement {
  // Log error for monitoring
  logFrontendError(
    error instanceof Error ? error.message : "Route error",
    {
      type: "route-error",
      status: isRouteErrorResponse(error) ? error.status : undefined,
      statusText: isRouteErrorResponse(error) ? error.statusText : undefined,
      stack: error instanceof Error ? error.stack : undefined,
    },
    { endpoint: "/logs" },
  );

  if (isRouteErrorResponse(error)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md text-center">
          <CardContent className="pt-6">
            <h1 className="text-6xl font-bold text-destructive mb-4">
              {error.status}
            </h1>
            <p className="text-lg text-muted-foreground mb-2">
              {error.status === 404 ? "Page Not Found" : "Something went wrong"}
            </p>
            <p className="text-muted-foreground">
              {error.statusText || "The requested page could not be found."}
            </p>
            <Button asChild className="mt-6">
              <a href="/">Go Home</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-lg text-center">
        <CardContent className="pt-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold text-destructive mb-2">
            Application Error
          </h1>
          <p className="text-muted-foreground mb-4">
            An unexpected error occurred. Please try again.
          </p>
          {import.meta.env.DEV && error instanceof Error && (
            <pre className="mt-4 p-4 bg-muted rounded-lg text-left text-xs overflow-auto max-h-48 text-muted-foreground">
              {error.stack}
            </pre>
          )}
          <Button asChild className="mt-6">
            <a href="/">Go Home</a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
