"use server";

import { checkEmailAvailability, verifyEmailInput } from "@/lib/server/email";
import {
	createEmailVerificationRequest,
	sendVerificationEmail,
	setEmailVerificationRequestCookie
} from "@/lib/server/email-verification";
import { verifyPasswordStrength } from "@/lib/server/password";
import { RefillingTokenBucket } from "@/lib/server/rate-limit";
import { createSession, generateSessionToken, setSessionTokenCookie } from "@/lib/server/session";
import { createUser, verifyUsernameInput } from "@/lib/server/user";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { globalPOSTRateLimit } from "@/lib/server/request";

import type { SessionFlags } from "@/lib/server/session";

const ipBucket = new RefillingTokenBucket<string>(3, 10);

export async function signupAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
	if (!globalPOSTRateLimit()) {
		return {
			message: "Too many requests"
		};
	}

	// TODO: Assumes X-Forwarded-For is always included.
	const clientIP = headers().get("X-Forwarded-For");
	if (clientIP !== null && !ipBucket.check(clientIP, 1)) {
		return {
			message: "Too many requests"
		};
	}

	const email = formData.get("email");
	const username = formData.get("username");
	const password = formData.get("password");
	if (typeof email !== "string" || typeof username !== "string" || typeof password !== "string") {
		return {
			message: "Invalid or missing fields"
		};
	}
	if (email === "" || password === "" || username === "") {
		return {
			message: "Please enter your username, email, and password"
		};
	}
	if (!verifyEmailInput(email)) {
		return {
			message: "Invalid email"
		};
	}
	const emailAvailable = checkEmailAvailability(email);
	if (!emailAvailable) {
		return {
			message: "Email is already used"
		};
	}
	if (!verifyUsernameInput(username)) {
		return {
			message: "Invalid username"
		};
	}
	const strongPassword = await verifyPasswordStrength(password);
	if (!strongPassword) {
		return {
			message: "Weak password"
		};
	}
	if (clientIP !== null && !ipBucket.consume(clientIP, 1)) {
		return {
			message: "Too many requests"
		};
	}
	const user = await createUser(email, username, password);
	const emailVerificationRequest = createEmailVerificationRequest(user.id, user.email);
	sendVerificationEmail(emailVerificationRequest.email, emailVerificationRequest.code);
	setEmailVerificationRequestCookie(emailVerificationRequest);

	const sessionFlags: SessionFlags = {
		twoFactorVerified: false
	};
	const sessionToken = generateSessionToken();
	const session = createSession(sessionToken, user.id, sessionFlags);
	setSessionTokenCookie(sessionToken, session.expiresAt);
	return redirect("/2fa/setup");
}

interface ActionResult {
	message: string;
}
