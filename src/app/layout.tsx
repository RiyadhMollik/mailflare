import type { Metadata, Viewport } from "next";
import { Inter, Geist_Mono, Space_Grotesk } from "next/font/google";
import { Providers } from "@/components/providers";
import { LanguageProvider } from "@/components/language-provider";
import { DEFAULT_LOCALE, getDirection } from "@/lib/i18n/utils";
import { getRequestLocale, loadServerMessages } from "@/lib/i18n/server";
import { sidebarBootstrapScript } from "@/components/sidebar-state-utils";
import { themeBootstrapScript } from "@/components/theme-utils";
import { getHomeBranding } from "./home-server-utils";
import "./globals.css";

// DevToSoft brand fonts: Inter for body (kept on the old --font-geist-sans variable so nothing else
// changes) and Space Grotesk for display headings (`font-display`).
const geistSans = Inter({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
	variable: "--font-display-var",
	subsets: ["latin"],
	weight: ["500", "600", "700"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

// Colours are the --background tokens in globals.css (light #f6f8fc, dark #202124).
// viewportFit "cover" lets the shell reach the notch and home indicator; the env(safe-area-inset-*) padding keeps content clear of them.
export const viewport: Viewport = {
	themeColor: [
		{ media: "(prefers-color-scheme: light)", color: "#f7f8ee" },
		{ media: "(prefers-color-scheme: dark)", color: "#050505" },
	],
	viewportFit: "cover",
};

export async function generateMetadata(): Promise<Metadata> {
	const { appName } = await getHomeBranding();
	return {
		title: appName,
		description: "Multi-tenant email on Cloudflare",
		icons: { icon: "/api/branding/icon", apple: "/apple-touch-icon.png" },
		appleWebApp: {
			capable: true,
			title: appName,
			statusBarStyle: "default",
		},
		robots: {
			index: false,
			follow: false,
			noarchive: true,
			nosnippet: true,
			noimageindex: true,
			googleBot: {
				index: false,
				follow: false,
				noarchive: true,
				nosnippet: true,
				noimageindex: true,
			},
		},
	};
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
	const locale = await getRequestLocale();
	const messages = locale === DEFAULT_LOCALE ? undefined : await loadServerMessages(locale);
	const branding = await getHomeBranding();
	return (
		<html lang={locale} dir={getDirection(locale)} data-remote-image-proxy="enabled" suppressHydrationWarning>
			<head>
				<script dangerouslySetInnerHTML={{ __html: sidebarBootstrapScript }} />
				<script dangerouslySetInnerHTML={{ __html: themeBootstrapScript }} />
				<link rel="icon" href="/api/branding/icon"></link>
			</head>
			<body className={`${geistSans.variable} ${geistMono.variable} ${spaceGrotesk.variable} antialiased`}>
				<LanguageProvider initialLocale={locale} initialMessages={messages}><Providers initialBranding={branding}>{children}</Providers></LanguageProvider>
			</body>
		</html>
	);
}
