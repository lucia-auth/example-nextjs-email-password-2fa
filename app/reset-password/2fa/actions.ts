"use server";

import { recoveryCodeBucket, resetUser2FAWithRecoveryCode, totpBucket } from "@/lib/server/2fa";
import { setPasswordResetSessionAs2FAVerified, validatePasswordResetSessionRequest } from "@/lib/server/password-reset";
import { globalPOSTRateLimit } from "@/lib/server/request";
import { getUserTOTPKey } from "@/lib/server/user";
import { verifyTOTP } from "@oslojs/otp";
import { redirect } from "next/navigation";

export async function verifyPasswordReset2FAWithTOTPAction(
	_prev: ActionResult,
	formData: FormData
): Promise<ActionResult> {
	if (!globalPOSTRateLimit()) {
		return {
			message: "Too many requests"
		};
	}
	const { session, user } = validatePasswordResetSessionRequest();
	if (session === null) {
		return {
			message: "Not authenticated"
		};
	}
	if (!session.emailVerified || !user.registered2FA || session.twoFactorVerified) {
		return {
			message: "Forbidden"
		};
	}
	if (!totpBucket.check(session.userId, 1)) {
		return {
			message: "Too many requests"
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
	if (!globalPOSTRateLimit()) {
		return {
			message: "Too many requests"
		};
	}
	const { session, user } = validatePasswordResetSessionRequest();
	if (session === null) {
		return {
			message: "Not authenticated"
		};
	}
	if (!session.emailVerified || !user.registered2FA || session.twoFactorVerified) {
		return {
			message: "Forbidden"
		};
	}

	if (!recoveryCodeBucket.check(session.userId, 1)) {
		return {
			message: "Too many requests"
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

interface ActionResult {
	message: string;
}
