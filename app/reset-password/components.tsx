"use client";

import { useFormState } from "react-dom";
import { resetPasswordAction } from "./actions";

const initialPasswordResetState = {
	message: ""
};

export function PasswordResetForm() {
	const [state, action] = useFormState(resetPasswordAction, initialPasswordResetState);
	return (
		<form action={action}>
			<label htmlFor="form-reset.password">Password</label>
			<input type="password" id="form-reset.password" name="password" autoComplete="new-password" required />
			<br />
			<button>Reset password</button>
			<p>{state.message}</p>
		</form>
	);
}
