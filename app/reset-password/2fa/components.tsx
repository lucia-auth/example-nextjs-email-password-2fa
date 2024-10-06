"use client";

import { useFormState } from "react-dom";
import { verifyPasswordReset2FAWithRecoveryCodeAction, verifyPasswordReset2FAWithTOTPAction } from "./actions";

const initialPasswordResetTOTPState = {
	message: ""
};

export function PasswordResetTOTPForm() {
	const [state, action] = useFormState(verifyPasswordReset2FAWithTOTPAction, initialPasswordResetTOTPState);
	return (
		<form action={action}>
			<label htmlFor="form-totp.code">Code</label>
			<input id="form-totp.code" name="code" required />
			<br />
			<button>Verify</button>
			<p>{state.message}</p>
		</form>
	);
}

const initialPasswordResetRecoveryCodeState = {
	message: ""
};

export function PasswordResetRecoveryCodeForm() {
	const [state, action] = useFormState(
		verifyPasswordReset2FAWithRecoveryCodeAction,
		initialPasswordResetRecoveryCodeState
	);
	return (
		<form action={action}>
			<label htmlFor="form-recovery-code.code">Recovery code</label>
			<input id="form-recovery-code.code" name="code" required />
			<br />
			<br />
			<button>Verify</button>
			<p>{state.message}</p>
		</form>
	);
}
