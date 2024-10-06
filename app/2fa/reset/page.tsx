import { TwoFactorResetForm } from "./components";

import { getCurrentSession } from "@/lib/server/session";
import { redirect } from "next/navigation";

export default function Page() {
	const { session, user } = getCurrentSession();
	if (session === null) {
		return redirect("/login");
	}
	if (!user.emailVerified) {
		return redirect("/verify-email");
	}
	if (!user.registered2FA) {
		return redirect("/2fa/setup");
	}
	if (session.twoFactorVerified) {
		return redirect("/");
	}
	return (
		<>
			<h1>Recover your account</h1>
			<TwoFactorResetForm />
		</>
	);
}
