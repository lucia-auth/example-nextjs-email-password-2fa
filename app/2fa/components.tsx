"use client";

import { verify2FAAction } from "./actions";
import { useFormState } from "react-dom";

const initial2FAVerificationState = {
	message: ""
};

export function TwoFactorVerificationForm() {
	const [state, action] = useFormState(verify2FAAction, initial2FAVerificationState);
	return (
		<form action={action}>
			<label htmlFor="form-totp.code">Code</label>
			<input id="form-totp.code" name="code" autoComplete="one-time-code" required />
			<br />
			<button>Verify</button>
			<p>{state.message}</p>
		</form>
	);
}
