"use client";

import { useFormState } from "react-dom";
import { verifyPasswordResetEmailAction } from "./actions";

const initialPasswordResetEmailVerificationState = {
	message: ""
};

export function PasswordResetEmailVerificationForm() {
	const [state, action] = useFormState(verifyPasswordResetEmailAction, initialPasswordResetEmailVerificationState);
	return (
		<form action={action}>
			<label htmlFor="form-verify.code">Code</label>
			<input id="form-verify.code" name="code" required />
			<button>verify</button>
			<p>{state.message}</p>
		</form>
	);
}
