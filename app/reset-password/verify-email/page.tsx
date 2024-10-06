import { PasswordResetEmailVerificationForm } from "./components";

import { validatePasswordResetSessionRequest } from "@/lib/server/password-reset";
import { redirect } from "next/navigation";

export default function Page() {
	const { session } = validatePasswordResetSessionRequest();
	if (session === null) {
		return redirect("/forgot-password");
	}
	if (session.emailVerified) {
		if (!session.twoFactorVerified) {
			return redirect("/reset-password/2fa");
		}
		return redirect("/reset-password");
	}
	return (
		<>
			<h1>Verify your email address</h1>
			<p>We sent an 8-digit code to {session.email}.</p>
			<PasswordResetEmailVerificationForm />
		</>
	);
}
