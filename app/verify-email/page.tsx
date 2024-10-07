import Link from "next/link";
import { EmailVerificationForm, ResendEmailVerificationCodeForm } from "./components";

import { getCurrentSession } from "@/lib/server/session";
import { redirect } from "next/navigation";
import { getUserEmailVerificationRequestFromRequest } from "@/lib/server/email-verification";
import { globalGETRateLimit } from "@/lib/server/request";

export default function Page() {
	if (!globalGETRateLimit()) {
		return "Too many requests";
	}
	const { user } = getCurrentSession();
	if (user === null) {
		return redirect("/login");
	}

	// TODO: Ideally we'd sent a new verification email automatically if the previous one is expired,
	// but we can't set cookies inside server components.
	const verificationRequest = getUserEmailVerificationRequestFromRequest();
	if (verificationRequest === null && user.emailVerified) {
		return redirect("/");
	}
	return (
		<>
			<h1>Verify your email address</h1>
			<p>We sent an 8-digit code to {verificationRequest?.email ?? user.email}.</p>
			<EmailVerificationForm />
			<ResendEmailVerificationCodeForm />
			<Link href="/settings">Change your email</Link>
		</>
	);
}
