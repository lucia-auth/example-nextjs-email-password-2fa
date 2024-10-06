import React from "react";
import { PasswordResetRecoveryCodeForm, PasswordResetTOTPForm } from "./components";

import { validatePasswordResetSessionRequest } from "@/lib/server/password-reset";
import { redirect } from "next/navigation";

export default function Page() {
	const { session, user } = validatePasswordResetSessionRequest();

	if (session === null) {
		return redirect("/forgot-password");
	}
	if (!session.emailVerified) {
		return redirect("/reset-password/verify-email");
	}
	if (!user.registered2FA) {
		return redirect("/reset-password");
	}
	if (session.twoFactorVerified) {
		return redirect("/reset-password");
	}
	return (
		<>
			<h1>Two-factor authentication</h1>
			<p>Enter the code in your authenticator app.</p>
			<PasswordResetTOTPForm />
			<section>
				<h2>Use your recovery code instead</h2>
				<PasswordResetRecoveryCodeForm />
			</section>
		</>
	);
}
