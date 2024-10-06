import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Email and password example with 2FA in Next.js"
};

export default function RootLayout({
	children
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<body>{children}</body>
		</html>
	);
}
