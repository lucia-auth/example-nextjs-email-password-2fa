"use server";

import { globalPOSTRateLimit } from "@/lib/server/request";
import { deleteSessionTokenCookie, getCurrentSession, invalidateSession } from "@/lib/server/session";
import { redirect } from "next/navigation";

export async function logoutAction(): Promise<ActionResult> {
	if (!globalPOSTRateLimit()) {
		return {
			message: "Too many requests"
		};
	}
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
