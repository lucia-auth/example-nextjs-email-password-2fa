"use client";

import { useFormState } from "react-dom";
import {
	forgotPasswordAction,
	resetPasswordAction,
	verifyPasswordReset2FAWithRecoveryCodeAction,
	verifyPasswordReset2FAWithTOTPAction,
	verifyPasswordResetEmailAction
} from "@/actions/password-reset";

const initialForgotPasswordState = {
	message: ""
};

export function ForgotPasswordForm() {
	const [state, action] = useFormState(forgotPasswordAction, initialForgotPasswordState);
	return (
		<form action={action}>
			<label htmlFor="form-forgot.email">Email</label>
			<input type="email" id="form-forgot.email" name="email" required />
			<br />
			<button>Send</button>
			<p>{state.message}</p>
		</form>
	);
}

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
