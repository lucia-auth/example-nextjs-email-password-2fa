"use client";

import { logoutAction } from "./actions";
import { useFormState } from "react-dom";

const initialState = {
	message: ""
};

export function LogoutButton() {
	const [, action] = useFormState(logoutAction, initialState);
	return (
		<form action={action}>
			<button>Sign out</button>
		</form>
	);
}
