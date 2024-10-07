"use server";

import { RefillingTokenBucket } from "@/lib/server/rate-limit";
import { globalPOSTRateLimit } from "@/lib/server/request";
import { getCurrentSession, setSessionAs2FAVerified } from "@/lib/server/session";
import { updateUserTOTPKey } from "@/lib/server/user";
import { decodeBase64 } from "@oslojs/encoding";
import { verifyTOTP } from "@oslojs/otp";
import { redirect } from "next/navigation";

const totpUpdateBucket = new RefillingTokenBucket<number>(3, 60 * 10);

export async function setup2FAAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
	if (!globalPOSTRateLimit()) {
		return {
			message: "Too many requests"
		};
	}
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

interface ActionResult {
	message: string;
}
