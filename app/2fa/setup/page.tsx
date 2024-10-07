import { TwoFactorSetUpForm } from "./components";

import { getCurrentSession } from "@/lib/server/session";
import { encodeBase64 } from "@oslojs/encoding";
import { createTOTPKeyURI } from "@oslojs/otp";
import { redirect } from "next/navigation";
import { renderSVG } from "uqr";
import { globalGETRateLimit } from "@/lib/server/request";

export default function Page() {
	if (!globalGETRateLimit()) {
		return "Too many requests";
	}
	const { session, user } = getCurrentSession();
	if (session === null) {
		return redirect("/login");
	}
	if (!user.emailVerified) {
		return redirect("/verify-email");
	}
	if (user.registered2FA && !session.twoFactorVerified) {
		return redirect("/2fa");
	}

	const totpKey = new Uint8Array(20);
	crypto.getRandomValues(totpKey);
	const encodedTOTPKey = encodeBase64(totpKey);
	const keyURI = createTOTPKeyURI("Demo", user.username, totpKey, 30, 6);
	const qrcode = renderSVG(keyURI);
	return (
		<>
			<h1>Set up two-factor authentication</h1>
			<div
				style={{
					width: "200px",
					height: "200px"
				}}
				dangerouslySetInnerHTML={{
					__html: qrcode
				}}
			></div>
			<TwoFactorSetUpForm encodedTOTPKey={encodedTOTPKey} />
		</>
	);
}
