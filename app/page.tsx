import { LogoutButton } from "./components";
import Link from "next/link";

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
	if (!session.twoFactorVerified) {
		return redirect("/2fa");
	}
	return (
		<>
			<header>
				<Link href="/">Home</Link>
				<Link href="/settings">Settings</Link>
			</header>
			<main>
				<h1>Hi {user.username}!</h1>
				<LogoutButton />
			</main>
		</>
	);
}
