"use client";

import { useFormState } from "react-dom";
import { forgotPasswordAction } from "./actions";

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
