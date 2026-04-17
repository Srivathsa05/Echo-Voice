import { Outlet, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import appCss from "../styles.css?url";
import { MeshBackground } from "@/components/MeshBackground";
import { Toaster } from "@/components/ui/sonner";
import { ChatWidget } from "@/components/chat/ChatWidget";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Echo — AI-Powered Patient Recall" },
      { name: "description", content: "Echo turns doctor consultations into clear summaries and the questions you forgot to ask. Voice-first AI for patient recall." },
      { property: "og:title", content: "Echo — AI-Powered Patient Recall" },
      { property: "og:description", content: "Patients forget 80% of clinical info in minutes. Echo reduces that to 0%." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFound,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head><HeadContent /></head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return (
    <>
      <MeshBackground />
      <Outlet />
      <ChatWidget />
      <Toaster />
    </>
  );
}

function NotFound() {
  return (
    <div className="min-h-screen grid place-items-center px-4">
      <div className="glass-strong rounded-3xl p-10 text-center max-w-md">
        <h1 className="text-7xl font-bold gradient-text">404</h1>
        <p className="mt-3 text-muted-foreground">This page got lost in transcription.</p>
        <a href="/" className="inline-block mt-6 px-5 py-2.5 rounded-xl gradient-primary text-primary-foreground text-sm font-medium">Go home</a>
      </div>
    </div>
  );
}
