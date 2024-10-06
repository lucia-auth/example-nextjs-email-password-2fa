"use client";

import { reset2FAAction, setup2FAAction, verify2FAAction } from "@/actions/2fa";
import { useFormState } from "react-dom";

const initial2FAVerificationState = {
	message: ""
};

export function TwoFactorVerificationForm() {
	const [state, action] = useFormState(verify2FAAction, initial2FAVerificationState);
	return (
		<form action={action}>
			<label htmlFor="form-totp.code">Enter the code from your app</label>
			<input id="form-totp.code" name="code" autoComplete="one-time-code" required />
			<br />
			<button>Verify</button>
			<p>{state.message}</p>
		</form>
	);
}

const initial2FASetUpState = {
	message: ""
};

export function TwoFactorSetUpForm(props: { encodedTOTPKey: string }) {
	const [state, action] = useFormState(setup2FAAction, initial2FASetUpState);
	return (
		<form action={action}>
			<input name="key" value={props.encodedTOTPKey} hidden required />
			<label htmlFor="form-totp.code">Verify the code from the app</label>
			<input id="form-totp.code" name="code" required />
			<br />
			<button>Save</button>
			<p>{state.message}</p>
		</form>
	);
}

const initial2FAResetState = {
	message: ""
};

export function TwoFactorResetForm() {
	const [state, action] = useFormState(reset2FAAction, initial2FAResetState);
	return (
		<form action={action}>
			<label htmlFor="form-totp.code">Recovery code</label>
			<input id="form-totp.code" name="code" required />
			<br />
			<button>Verify</button>
			<p>{state.message ?? ""}</p>
		</form>
	);
}
