"use server";

import { deleteSessionTokenCookie, getCurrentSession, invalidateSession } from "@/lib/server/session";
import { redirect } from "next/navigation";

export async function logoutAction(): Promise<ActionResult> {
	const { session } = getCurrentSession();
	if (session === null) {
		return {
			message: "Not authenticated"
		};
	}
	invalidateSession(session.id);
	deleteSessionTokenCookie();
	return redirect("/login");
}

interface ActionResult {
	message: string;
}
