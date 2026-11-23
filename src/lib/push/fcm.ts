/**
 * Android push through Firebase Cloud Messaging (HTTP v1), on Web Crypto so it
 * runs on Workers and Node without the Firebase Admin SDK.
 *
 * Configured with the `FCM_SERVICE_ACCOUNT` secret: the full JSON of a Firebase
 * service-account key (Firebase console -> Project settings -> Service accounts).
 * Messages are data-only and carry ids, never sender or subject: Google sees
 * nothing about the mail, and the app fetches the details over JMAP with its own
 * device key before it shows the notification.
 */

type ServiceAccount = { projectId: string; clientEmail: string; privateKey: string };

export type FcmData = Record<string, string>;
export type FcmResult = { kind: "sent" } | { kind: "gone"; status: number } | { kind: "failed"; status: number; error: string };

export function fcmConfig(env: CloudflareEnv): ServiceAccount | null {
	const raw = env.FCM_SERVICE_ACCOUNT?.trim();
	if (!raw) return null;
	try {
		const parsed = JSON.parse(raw) as { project_id?: string; client_email?: string; private_key?: string };
		if (!parsed.project_id || !parsed.client_email || !parsed.private_key) return null;
		return { projectId: parsed.project_id, clientEmail: parsed.client_email, privateKey: parsed.private_key };
	} catch {
		return null;
	}
}

function base64Url(bytes: Uint8Array): string {
	let binary = "";
	for (const byte of bytes) binary += String.fromCharCode(byte);
	return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function utf8(value: string): Uint8Array<ArrayBuffer> {
	return new Uint8Array(new TextEncoder().encode(value));
}

function pemToDer(pem: string): ArrayBuffer {
	const body = pem.replace(/-----BEGIN [^-]+-----/g, "").replace(/-----END [^-]+-----/g, "").replace(/\s+/g, "");
	const binary = atob(body);
	const out = new ArrayBuffer(binary.length);
	const view = new Uint8Array(out);
	for (let index = 0; index < binary.length; index += 1) view[index] = binary.charCodeAt(index);
	return out;
}

let cachedToken: { value: string; clientEmail: string; expiresAt: number } | null = null;

/** Google OAuth access token for the service account; valid an hour, refreshed a few minutes early. */
async function accessToken(config: ServiceAccount): Promise<string> {
	const now = Date.now();
	if (cachedToken && cachedToken.clientEmail === config.clientEmail && cachedToken.expiresAt > now) return cachedToken.value;
	const issuedAt = Math.floor(now / 1000);
	const header = base64Url(utf8(JSON.stringify({ alg: "RS256", typ: "JWT" })));
	const claims = base64Url(
		utf8(
			JSON.stringify({
				iss: config.clientEmail,
				scope: "https://www.googleapis.com/auth/firebase.messaging",
				aud: "https://oauth2.googleapis.com/token",
				iat: issuedAt,
				exp: issuedAt + 3600,
			}),
		),
	);
	const key = await crypto.subtle.importKey("pkcs8", pemToDer(config.privateKey), { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
	const signature = new Uint8Array(await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, utf8(`${header}.${claims}`)));
	const assertion = `${header}.${claims}.${base64Url(signature)}`;
	const response = await fetch("https://oauth2.googleapis.com/token", {
		method: "POST",
		headers: { "content-type": "application/x-www-form-urlencoded" },
		body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion }),
	});
	const body = (await response.json().catch(() => ({}))) as { access_token?: string; expires_in?: number; error_description?: string };
	if (!response.ok || !body.access_token) throw new Error(`FCM OAuth failed (${response.status} ${body.error_description ?? ""})`);
	cachedToken = { value: body.access_token, clientEmail: config.clientEmail, expiresAt: now + Math.max(60, (body.expires_in ?? 3600) - 300) * 1000 };
	return body.access_token;
}

/** Sends one high-priority data message. A 404 (UNREGISTERED) means the app was uninstalled or the token rotated. */
export async function sendFcm(config: ServiceAccount, token: string, data: FcmData, collapseKey: string): Promise<FcmResult> {
	const bearer = await accessToken(config);
	const response = await fetch(`https://fcm.googleapis.com/v1/projects/${encodeURIComponent(config.projectId)}/messages:send`, {
		method: "POST",
		headers: { authorization: `Bearer ${bearer}`, "content-type": "application/json" },
		body: JSON.stringify({
			message: {
				token,
				data,
				android: { priority: "HIGH", collapse_key: collapseKey.slice(0, 64), ttl: "86400s" },
			},
		}),
	});
	if (response.ok) return { kind: "sent" };
	const body = (await response.json().catch(() => ({}))) as { error?: { status?: string; message?: string } };
	if (response.status === 404 || body.error?.status === "NOT_FOUND" || body.error?.status === "UNREGISTERED") return { kind: "gone", status: response.status };
	return { kind: "failed", status: response.status, error: body.error?.message ?? body.error?.status ?? "" };
}
