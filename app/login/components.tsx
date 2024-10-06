"use client";

import { loginAction } from "./actions";
import { useFormState } from "react-dom";

const initialState = {
	message: ""
};

export function LoginForm() {
	const [state, action] = useFormState(loginAction, initialState);

	return (
		<form action={action}>
			<label htmlFor="form-login.email">Email</label>
			<input type="email" id="form-login.email" name="email" autoComplete="username" required />
			<br />
			<label htmlFor="form-login.password">Password</label>
			<input type="password" id="form-login.password" name="password" autoComplete="current-password" required />
			<br />
			<button>Continue</button>
			<p>{state.message}</p>
		</form>
	);
}
