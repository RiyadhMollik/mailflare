import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { heroMessages, sidebarItems } from "./utils";
import { ArrowRight, Inbox, Mail, Search } from "@/components/icons";
import { getServerTranslator } from "@/lib/i18n/server";
import { getCurrentUser } from "@/lib/auth/cookies";
import { getEnv } from "@/lib/cloudflare";
import { LanguageSelector } from "@/components/language-selector";
import { getHomeBranding } from "./home-server-utils";
import { HomeAuthProvider } from "./home-auth";
import { HomeHeaderActions } from "./home-header-actions";
import { HomeHeroActions } from "./home-hero-actions";

export const dynamic = "force-dynamic";

const SITE_URL = "https://devtosoft.com";
const CONTACT_EMAIL = "info@devtosoft.com";

const features = [
  { n: "01", title: "Custom-domain email", body: "Personal or shared mailboxes on your own domain. Send and receive with Cloudflare, Resend or Amazon SES." },
  { n: "02", title: "Smart routing", body: "Store, forward, reject or sort incoming mail with rules that run before it ever reaches the inbox." },
  { n: "03", title: "Calendar & booking", body: "Repeating events, time zones, invitations, and a public link so anyone can book a free slot." },
  { n: "04", title: "Drive", body: "Store, preview and share files next to your mail, backed by object storage you control." },
  { n: "05", title: "AI agents", body: "Search mail, draft replies and manage events. Connect your own AI tools over MCP." },
  { n: "06", title: "Admin & security", body: "Users, API keys, webhooks, audit logs, spam filtering, 2FA and scheduled backups." },
];

const steps = [
  { n: "01", label: "Connect", body: "Add your domain. DNS and routing are set up for you." },
  { n: "02", label: "Create", body: "Spin up mailboxes for people, teams and products." },
  { n: "03", label: "Deliver", body: "Send, receive and automate from one fast inbox." },
];

export async function generateMetadata(): Promise<Metadata> {
  const branding = await getHomeBranding();
  return {
    title: branding.appName,
    icons: { icon: branding.hasCustomIcon ? "/api/branding/icon" : "/icon-96.png" },
  };
}

export default async function HomePage() {
  const [branding, t, sessionUser] = await Promise.all([
    getHomeBranding(),
    getServerTranslator(),
    // A session lookup failure must not take down the public landing page.
    getCurrentUser(getEnv()).catch(() => null),
  ]);
  // Signed-in users skip the landing page; the inbox restores their last-used mailbox.
  if (sessionUser && !sessionUser.disabled) redirect("/inbox");

  // Render the signed-in account from the server response so the header does not
  // wait for hydration and an /api/auth/me round trip before showing it.
  const initialUser = sessionUser
    ? {
        id: sessionUser.id,
        email: sessionUser.email,
        name: sessionUser.name,
        role: sessionUser.role,
        hasAvatar: !!sessionUser.avatarKey,
        calendarEnabled: sessionUser.calendarEnabled,
        driveEnabled: sessionUser.driveEnabled,
      }
    : null;

  const iconSrc = branding.hasCustomIcon ? "/api/branding/icon" : "/icon-96.png";

  return (
    <HomeAuthProvider initialUser={initialUser}>
      {/* The landing page is always the DevToSoft dark brand, whatever theme the app uses. */}
      <div className="dark safe-area relative min-h-dvh overflow-x-clip bg-[#050505] text-white [color-scheme:dark]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-70"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
            maskImage: "linear-gradient(to bottom, black 35%, transparent 95%)",
            WebkitMaskImage: "linear-gradient(to bottom, black 35%, transparent 95%)",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -left-40 -top-40 h-[34rem] w-[34rem] rounded-full bg-[#DDF000]/10 blur-[120px]"
        />

        <div className="relative border-b border-white/5 text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-400">
          <div className="mx-auto flex h-8 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
            <span className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#DDF000]" />
              <span className="hidden sm:inline">Business email by DevToSoft</span>
              <span className="sm:hidden">By DevToSoft</span>
            </span>
            <a href={`mailto:${CONTACT_EMAIL}`} className="normal-case tracking-normal transition-colors hover:text-[#DDF000]">
              {CONTACT_EMAIL}
            </a>
          </div>
        </div>

        <header className="relative mx-auto flex h-20 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3" aria-label={t("home.homeLabel", { app: branding.appName })}>
            <img src={iconSrc} height={36} width={36} alt="" className="rounded-lg" />
            <span className="font-display text-lg font-bold uppercase tracking-tight">{branding.appName}</span>
          </Link>

          <nav className="hidden items-center gap-8 text-xs font-semibold uppercase tracking-[0.14em] text-neutral-300 md:flex">
            <a href="#features" className="transition-colors hover:text-[#DDF000]">Features</a>
            <a href="#how" className="transition-colors hover:text-[#DDF000]">How it works</a>
            <a href={SITE_URL} target="_blank" rel="noreferrer" className="transition-colors hover:text-[#DDF000]">DevToSoft</a>
          </nav>

          <div className="flex items-center gap-2">
            <div className="hidden sm:block">
              <LanguageSelector variant="text" />
            </div>
            <HomeHeaderActions />
          </div>
        </header>

        <main className="relative">
          <section className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-4 pb-20 pt-10 sm:px-6 md:pt-16 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
            <div className="flex flex-col justify-center">
              <h1 className="font-display text-[2.6rem] font-bold uppercase leading-[0.98] tracking-tight sm:text-6xl lg:text-[4.4rem]">
                Email that moves <span className="text-[#DDF000]">business</span> forward.
              </h1>
              <p className="mt-7 max-w-xl text-lg leading-8 text-neutral-400">{t("home.subheadline")}</p>
              <HomeHeroActions />
            </div>

            <div className="relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#0a0a0a] shadow-[0_30px_90px_-40px_rgba(221,240,0,0.35)]">
              <div className="flex items-center justify-between border-b border-white/10 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
                <span>{branding.appName} / Webmail</span>
                <span className="flex items-center gap-2 text-neutral-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#DDF000]" />
                  Live
                </span>
              </div>

              <div className="grid min-h-[380px] grid-cols-[168px_1fr]">
                <aside className="hidden flex-col gap-1.5 border-r border-white/10 px-3 py-4 sm:flex">
                  <div className="mb-3 flex h-10 w-fit items-center gap-2 rounded-xl bg-[#DDF000] px-4 text-xs font-bold uppercase tracking-wide text-[#050505]">
                    <Mail className="h-4 w-4" />
                    {t("navigation.compose")}
                  </div>
                  {sidebarItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <div
                        key={item.labelKey}
                        className={`flex h-9 items-center justify-between rounded-lg px-3 text-sm font-medium ${
                          item.active ? "bg-[#DDF000]/10 text-[#DDF000]" : "text-neutral-400"
                        }`}
                      >
                        <span className="flex items-center gap-3">
                          <Icon className="h-4 w-4" />
                          {t(item.labelKey)}
                        </span>
                        {item.count && <span className="text-xs">{item.count}</span>}
                      </div>
                    );
                  })}
                </aside>

                <div className="col-span-2 flex min-w-0 flex-col sm:col-span-1">
                  <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
                    <div className="flex h-10 flex-1 items-center gap-3 rounded-xl bg-white/5 px-4 text-neutral-400">
                      <Search className="h-4 w-4" />
                      <span className="text-sm">{t("search.mail")}</span>
                    </div>
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#DDF000] text-[#050505]">
                      <Inbox className="h-4 w-4" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between px-5 py-3">
                    <div className="flex items-center gap-3">
                      <h2 className="font-display text-base font-semibold uppercase tracking-wide">{t("home.mockPriority")}</h2>
                      <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-medium text-neutral-300">18</span>
                    </div>
                    <span className="hidden text-xs text-neutral-500 md:inline">{t("home.mockUpdated")}</span>
                  </div>

                  <div className="divide-y divide-white/5">
                    {heroMessages.map((message) => (
                      <div
                        key={message.sender}
                        className="grid min-h-14 grid-cols-[minmax(96px,150px)_1fr_auto] items-center gap-3 px-5 text-sm transition-colors hover:bg-white/[0.03]"
                      >
                        <span className="truncate font-semibold text-white">{message.sender}</span>
                        <span className="truncate text-neutral-400">
                          <span className="font-medium text-neutral-200">{t(message.subjectKey)}</span>
                          <span className="hidden text-neutral-500 md:inline"> - {t(message.previewKey)}</span>
                        </span>
                        <span className="rounded-full bg-[#DDF000]/10 px-2.5 py-1 text-xs font-semibold text-[#DDF000]">
                          {t(message.badgeKey)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 border-t border-white/10 text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
                {["Receive", "Route", "Deliver"].map((label, i) => (
                  <div key={label} className="flex items-center gap-2 px-5 py-3 [&:not(:first-child)]:border-l [&:not(:first-child)]:border-white/10">
                    <span className="text-[#DDF000]">0{i + 1}</span>
                    {label}
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section id="features" className="mx-auto max-w-7xl scroll-mt-8 px-4 pb-24 sm:px-6 lg:px-8">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#DDF000]">What you get</p>
            <h2 className="mt-3 max-w-3xl font-display text-3xl font-bold uppercase leading-tight tracking-tight sm:text-5xl">
              One workspace. Your domain. <span className="text-[#DDF000]">Your rules.</span>
            </h2>
            <div className="mt-12 grid gap-px overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((f) => (
                <div key={f.n} className="group bg-[#080808] p-7 transition-colors hover:bg-[#0f0f0f]">
                  <span className="text-xs font-semibold tracking-[0.2em] text-[#DDF000]">{f.n}</span>
                  <h3 className="mt-4 font-display text-xl font-semibold uppercase tracking-tight">{f.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-neutral-400">{f.body}</p>
                </div>
              ))}
            </div>
          </section>

          <section id="how" className="mx-auto max-w-7xl scroll-mt-8 px-4 pb-24 sm:px-6 lg:px-8">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#DDF000]">How it works</p>
            <h2 className="mt-3 font-display text-3xl font-bold uppercase leading-tight tracking-tight sm:text-5xl">
              Innovate. Automate. <span className="text-[#DDF000]">Elevate.</span>
            </h2>
            <div className="mt-12 grid gap-4 md:grid-cols-3">
              {steps.map((s) => (
                <div key={s.n} className="rounded-2xl border border-white/10 bg-[#0a0a0a] p-7">
                  <span className="font-display text-5xl font-bold text-[#DDF000]">{s.n}</span>
                  <h3 className="mt-5 font-display text-lg font-semibold uppercase tracking-wide">{s.label}</h3>
                  <p className="mt-2 text-sm leading-6 text-neutral-400">{s.body}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
            <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#0a0a0a] px-6 py-14 text-center sm:px-12">
              <div aria-hidden className="pointer-events-none absolute left-1/2 top-0 h-64 w-[36rem] -translate-x-1/2 rounded-full bg-[#DDF000]/10 blur-[100px]" />
              <h2 className="relative mx-auto max-w-2xl font-display text-3xl font-bold uppercase leading-tight tracking-tight sm:text-5xl">
                Ready to take your mail <span className="text-[#DDF000]">back?</span>
              </h2>
              <p className="relative mx-auto mt-5 max-w-xl text-neutral-400">Set up your domain in minutes and own every message you send and receive.</p>
              <div className="relative mt-8 flex justify-center">
                <Link
                  href={sessionUser ? "/inbox" : "/setup"}
                  className="inline-flex h-12 items-center gap-2 rounded-xl bg-[#DDF000] px-8 text-sm font-bold uppercase tracking-wide text-[#050505] transition-colors hover:bg-[#c9dc00]"
                >
                  Get started
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </section>
        </main>

        <footer className="relative border-t border-white/10">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-8 text-xs text-neutral-500 sm:flex-row sm:px-6 lg:px-8">
            <span>
              &copy; {new Date().getFullYear()}{" "}
              <a href={SITE_URL} target="_blank" rel="noreferrer" className="font-semibold text-neutral-300 transition-colors hover:text-[#DDF000]">
                DevToSoft
              </a>
              . Innovate, automate, elevate.
            </span>
            <a href={`mailto:${CONTACT_EMAIL}`} className="transition-colors hover:text-[#DDF000]">
              {CONTACT_EMAIL}
            </a>
          </div>
        </footer>
      </div>
    </HomeAuthProvider>
  );
}
