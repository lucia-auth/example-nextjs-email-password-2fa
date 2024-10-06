"use server";

import { recoveryCodeBucket, resetUser2FAWithRecoveryCode, totpBucket } from "@/lib/server/2fa";
import { RefillingTokenBucket } from "@/lib/server/rate-limit";
import { getCurrentSession, setSessionAs2FAVerified } from "@/lib/server/session";
import { getUserTOTPKey, updateUserTOTPKey } from "@/lib/server/user";
import { decodeBase64 } from "@oslojs/encoding";
import { verifyTOTP } from "@oslojs/otp";
import { redirect } from "next/navigation";

export async function verify2FAAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
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
	if (!user.registered2FA) {
		return {
			message: "Forbidden"
		};
	}
	if (!totpBucket.check(user.id, 1)) {
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
			message: "Enter your code"
		};
	}
	if (!totpBucket.consume(user.id, 1)) {
		return {
			message: "Too many requests"
		};
	}
	const totpKey = getUserTOTPKey(user.id);
	if (totpKey === null) {
		return {
			message: "Forbidden"
		};
	}
	if (!verifyTOTP(totpKey, 30, 6, code)) {
		return {
			message: "Invalid code"
		};
	}
	totpBucket.reset(user.id);
	setSessionAs2FAVerified(session.id);
	return redirect("/");
}

const totpUpdateBucket = new RefillingTokenBucket<number>(3, 60 * 10);

export async function setup2FAAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
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
	if (!totpUpdateBucket.check(user.id, 1)) {
		return {
			message: "Too many requests"
		};
	}

	const encodedKey = formData.get("key");
	const code = formData.get("code");
	if (typeof encodedKey !== "string" || typeof code !== "string") {
		return {
			message: "Invalid or missing fields"
		};
	}
	if (code === "") {
		return {
			message: "Please enter your code"
		};
	}
	if (encodedKey.length !== 28) {
		return {
			message: "Please enter your code"
		};
	}
	let key: Uint8Array;
	try {
		key = decodeBase64(encodedKey);
	} catch {
		return {
			message: "Invalid key"
		};
	}
	if (key.byteLength !== 20) {
		return {
			message: "Invalid key"
		};
	}
	if (!totpUpdateBucket.consume(user.id, 1)) {
		return {
			message: "Too many requests"
		};
	}
	if (!verifyTOTP(key, 30, 6, code)) {
		return {
			message: "Invalid code"
		};
	}
	updateUserTOTPKey(session.userId, key);
	setSessionAs2FAVerified(session.id);
	return redirect("/recovery-code");
}

export async function reset2FAAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
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
	if (!user.registered2FA) {
		return {
			message: "Forbidden"
		};
	}
	if (!recoveryCodeBucket.check(user.id, 1)) {
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
	if (!recoveryCodeBucket.consume(user.id, 1)) {
		return {
			message: "Too many requests"
		};
	}
	const valid = resetUser2FAWithRecoveryCode(user.id, code);
	if (!valid) {
		return {
			message: "Invalid recovery code"
		};
	}
	recoveryCodeBucket.reset(user.id);
	return redirect("/2fa/setup");
}

interface ActionResult {
	message: string;
}
