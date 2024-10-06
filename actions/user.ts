"use server";

import { verifyPasswordHash, verifyPasswordStrength } from "@/lib/server/password";
import { Throttler } from "@/lib/server/rate-limit";
import {
	createSession,
	generateSessionToken,
	getCurrentSession,
	invalidateUserSessions,
	setSessionTokenCookie
} from "@/lib/server/session";
import { getUserPasswordHash, updateUserPassword } from "@/lib/server/user";
import {
	createEmailVerificationRequest,
	sendVerificationEmail,
	sendVerificationEmailBucket,
	setEmailVerificationRequestCookie
} from "@/lib/server/email-verification";
import { checkEmailAvailability, verifyEmailInput } from "@/lib/server/email";
import { redirect } from "next/navigation";

import type { SessionFlags } from "@/lib/server/session";

const passwordThrottler = new Throttler<number>([1, 2, 4, 8, 16, 30, 60, 180, 300]);

export async function updatePasswordAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
	const { session, user } = getCurrentSession();
	if (session === null) {
		return {
			message: "Not authenticated"
		};
	}
	if (!user.emailVerified) {
		return {
			message: "Forbidden"
		};
	}
	if (user.registered2FA && !session.twoFactorVerified) {
		return {
			message: "Forbidden"
		};
	}

	const password = formData.get("password");
	const newPassword = formData.get("new_password");
	if (typeof password !== "string" || typeof newPassword !== "string") {
		return {
			message: "Invalid or missing fields"
		};
	}
	const strongPassword = await verifyPasswordStrength(newPassword);
	if (!strongPassword) {
		return {
			message: "Weak password"
		};
	}
	if (!passwordThrottler.consume(user.id)) {
		return {
			message: "Too many requests"
		};
	}
	const passwordHash = getUserPasswordHash(user.id);
	const validPassword = await verifyPasswordHash(passwordHash, password);
	if (!validPassword) {
		return {
			message: "Incorrect password"
		};
	}
	invalidateUserSessions(user.id);
	await updateUserPassword(user.id, newPassword);

	const sessionToken = generateSessionToken();
	const sessionFlags: SessionFlags = {
		twoFactorVerified: session.twoFactorVerified
	};
	const newSession = createSession(sessionToken, user.id, sessionFlags);
	setSessionTokenCookie(sessionToken, newSession.expiresAt);
	return {
		message: "Updated password"
	};
}

export async function updateEmailAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
	const { session, user } = getCurrentSession();
	if (session === null) {
		return {
			message: "Not authenticated"
		};
	}
	if (user.registered2FA && !session.twoFactorVerified) {
		return {
			message: "Forbidden"
		};
	}
	if (!sendVerificationEmailBucket.check(user.id, 1)) {
		return {
			message: "Too many requests"
		};
	}

	const email = formData.get("email");
	if (typeof email !== "string") {
		return { message: "Invalid or missing fields" };
	}
	if (email === "") {
		return {
			message: "Please enter your email"
		};
	}
	if (!verifyEmailInput(email)) {
		return {
			message: "Please enter a valid email"
		};
	}
	const emailAvailable = checkEmailAvailability(email);
	if (!emailAvailable) {
		return {
			message: "This email is already used"
		};
	}
	if (!sendVerificationEmailBucket.consume(user.id, 1)) {
		return {
			message: "Too many requests"
		};
	}
	const verificationRequest = createEmailVerificationRequest(user.id, email);
	sendVerificationEmail(verificationRequest.email, verificationRequest.code);
	setEmailVerificationRequestCookie(verificationRequest);
	return redirect("/verify-email");
}

interface ActionResult {
	message: string;
}
