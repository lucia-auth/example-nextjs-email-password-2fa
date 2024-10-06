import React from "react";
import { ForgotPasswordForm } from "@/components/password-reset";
import Link from "next/link";

export default function Page() {
	return (
		<>
			<h1>Forgot your password?</h1>
			<ForgotPasswordForm />
			<Link href="/login">Sign in</Link>
		</>
	);
}
