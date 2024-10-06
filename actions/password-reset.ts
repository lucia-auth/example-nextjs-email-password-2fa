"use server";

import { recoveryCodeBucket, resetUser2FAWithRecoveryCode, totpBucket } from "@/lib/server/2fa";
import { verifyEmailInput } from "@/lib/server/email";
import { verifyPasswordStrength } from "@/lib/server/password";
import {
	createPasswordResetSession,
	deletePasswordResetSessionTokenCookie,
	invalidateUserPasswordResetSessions,
	sendPasswordResetEmail,
	setPasswordResetSessionAs2FAVerified,
	setPasswordResetSessionAsEmailVerified,
	setPasswordResetSessionTokenCookie,
	validatePasswordResetSessionRequest
} from "@/lib/server/password-reset";
import { ExpiringTokenBucket, RefillingTokenBucket } from "@/lib/server/rate-limit";
import {
	createSession,
	generateSessionToken,
	invalidateUserSessions,
	setSessionTokenCookie
} from "@/lib/server/session";
import {
	getUserFromEmail,
	getUserTOTPKey,
	setUserAsEmailVerifiedIfEmailMatches,
	updateUserPassword
} from "@/lib/server/user";
import { verifyTOTP } from "@oslojs/otp";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import type { SessionFlags } from "@/lib/server/session";

const passwordResetEmailIPBucket = new RefillingTokenBucket<string>(3, 60);
const passwordResetEmailUserBucket = new RefillingTokenBucket<number>(3, 60);

export async function forgotPasswordAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
	// TODO: Assumes X-Forwarded-For is always included.
	const clientIP = headers().get("X-Forwarded-For");
	if (clientIP !== null && !passwordResetEmailIPBucket.check(clientIP, 1)) {
		return {
			message: "Too many requests"
		};
	}

	const email = formData.get("email");
	if (typeof email !== "string") {
		return {
			message: "Invalid or missing fields"
		};
	}
	if (!verifyEmailInput(email)) {
		return {
			message: "Invalid email"
		};
	}
	const user = getUserFromEmail(email);
	if (user === null) {
		return {
			message: "Account does not exist"
		};
	}
	if (clientIP !== null && !passwordResetEmailIPBucket.consume(clientIP, 1)) {
		return {
			message: "Too many requests"
		};
	}
	if (!passwordResetEmailUserBucket.consume(user.id, 1)) {
		return {
			message: "Too many requests"
		};
	}
	invalidateUserPasswordResetSessions(user.id);
	const sessionToken = generateSessionToken();
	const session = createPasswordResetSession(sessionToken, user.id, user.email);

	sendPasswordResetEmail(session.email, session.code);
	setPasswordResetSessionTokenCookie(sessionToken, session.expiresAt);
	return redirect("/reset-password/verify-email");
}

const emailVerificationBucket = new ExpiringTokenBucket<number>(5, 60 * 30);

export async function verifyPasswordResetEmailAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
	const { session } = validatePasswordResetSessionRequest();
	if (session === null) {
		return {
			message: "Not authenticated"
		};
	}
	if (!emailVerificationBucket.check(session.userId, 1)) {
		return {
			message: "Too many requests"
		};
	}

	if (session.emailVerified) {
		return {
			message: "Already verified"
		};
	}
	const code = formData.get("code");
	if (typeof code !== "string") {
		return {
			message: "Invalid or missing fields"
		};
	}
	if (code === "") {
		return {
			message: "Please enter your code"
		};
	}
	if (!emailVerificationBucket.consume(session.userId, 1)) {
		return { message: "Too many requests" };
	}
	if (code !== session.code) {
		return {
			message: "Incorrect code"
		};
	}
	emailVerificationBucket.reset(session.userId);
	setPasswordResetSessionAsEmailVerified(session.id);
	const emailMatches = setUserAsEmailVerifiedIfEmailMatches(session.userId, session.email);
	if (!emailMatches) {
		return {
			message: "Please restart the process"
		};
	}
	return redirect("/reset-password/2fa");
}

export async function verifyPasswordReset2FAWithTOTPAction(
	_prev: ActionResult,
	formData: FormData
): Promise<ActionResult> {
	const { session, user } = validatePasswordResetSessionRequest();
	if (session === null) {
		return {
			message: "Not authenticated"
		};
	}
	if (!totpBucket.check(session.userId, 1)) {
		return {
			message: "Too many requests"
		};
	}
	if (!user.registered2FA || session.twoFactorVerified || !session.emailVerified) {
		return {
			message: "Forbidden"
		};
	}

	const code = formData.get("code");
	if (typeof code !== "string") {
		return {
			message: "Invalid or missing fields"
		};
	}
	if (code === "") {
		return {
			message: "Please enter your code"
		};
	}
	const totpKey = getUserTOTPKey(session.userId);
	if (totpKey === null) {
		return {
			message: "Forbidden"
		};
	}
	if (!totpBucket.consume(session.userId, 1)) {
		return {
			message: "Too many requests"
		};
	}
	if (!verifyTOTP(totpKey, 30, 6, code)) {
		return {
			message: "Invalid code"
		};
	}
	totpBucket.reset(session.userId);
	setPasswordResetSessionAs2FAVerified(session.id);
	return redirect("/reset-password");
}

export async function verifyPasswordReset2FAWithRecoveryCodeAction(
	_prev: ActionResult,
	formData: FormData
): Promise<ActionResult> {
	const { session } = validatePasswordResetSessionRequest();
	if (session === null) {
		return {
			message: "Not authenticated"
		};
	}
	if (!session.emailVerified) {
		return {
			message: "Forbidden"
		};
	}
	if (!recoveryCodeBucket.check(session.userId, 1)) {
		return {
			message: "Too many requests"
		};
	}
	if (session.twoFactorVerified) {
		return {
			message: "Already verified"
		};
	}

	const code = formData.get("code");
	if (typeof code !== "string") {
		return {
			message: "Invalid or missing fields"
		};
	}
	if (code === "") {
		return {
			message: "Please enter your code"
		};
	}
	if (!recoveryCodeBucket.consume(session.userId, 1)) {
		return {
			message: "Too many requests"
		};
	}
	const valid = resetUser2FAWithRecoveryCode(session.userId, code);
	if (!valid) {
		return {
			message: "Invalid code"
		};
	}
	recoveryCodeBucket.reset(session.userId);
	return redirect("/reset-password");
}

export async function resetPasswordAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
	const { session: passwordResetSession, user } = validatePasswordResetSessionRequest();
	if (passwordResetSession === null) {
		return {
			message: "Not authenticated"
		};
	}
	if (!passwordResetSession.emailVerified) {
		return {
			message: "Forbidden"
		};
	}
	if (user.registered2FA && !passwordResetSession.twoFactorVerified) {
		return {
			message: "Forbidden"
		};
	}

	const password = formData.get("password");
	if (typeof password !== "string") {
		return {
			message: "Invalid or missing fields"
		};
	}

	const strongPassword = await verifyPasswordStrength(password);
	if (!strongPassword) {
		return {
			message: "Weak password"
		};
	}
	invalidateUserPasswordResetSessions(passwordResetSession.userId);
	invalidateUserSessions(passwordResetSession.userId);
	await updateUserPassword(passwordResetSession.userId, password);

	const sessionFlags: SessionFlags = {
		twoFactorVerified: passwordResetSession.twoFactorVerified
	};
	const sessionToken = generateSessionToken();
	const session = createSession(sessionToken, user.id, sessionFlags);
	setSessionTokenCookie(sessionToken, session.expiresAt);
	deletePasswordResetSessionTokenCookie();
	return redirect("/");
}

interface ActionResult {
	message: string;
}
