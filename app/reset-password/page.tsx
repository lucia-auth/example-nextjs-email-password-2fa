import { PasswordResetForm } from "./components";

import { validatePasswordResetSessionRequest } from "@/lib/server/password-reset";
import { globalGETRateLimit } from "@/lib/server/request";
import { redirect } from "next/navigation";

export default function Page() {
	if (!globalGETRateLimit()) {
		return "Too many requests";
	}
	const { session, user } = validatePasswordResetSessionRequest();
	if (session === null) {
		return redirect("/forgot-password");
	}
	if (!session.emailVerified) {
		return redirect("/reset-password/verify-email");
	}
	if (user.registered2FA && !session.twoFactorVerified) {
		return redirect("/reset-password/2fa");
	}
	return (
		<>
			<h1>Enter your new password</h1>
			<PasswordResetForm />
		</>
	);
}
