import React from "react";
import Link from "next/link";

import { getCurrentSession } from "@/lib/server/session";
import { getUserRecoverCode } from "@/lib/server/user";
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
	if (!session.twoFactorVerified) {
		return redirect("/2fa");
	}
	const recoveryCode = getUserRecoverCode(user.id);
	return (
		<>
			<h1>Recovery code</h1>
			<p>Your recovery code is: {recoveryCode}</p>
			<p>You can use this recovery code if you lose access to your second factors.</p>
			<Link href="/">Next</Link>
		</>
	);
}
