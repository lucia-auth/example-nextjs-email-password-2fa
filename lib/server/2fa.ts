import { db } from "./db";
import { decryptToString, encryptString } from "./encryption";
import { ExpiringTokenBucket } from "./rate-limit";
import { generateRandomRecoveryCode } from "./utils";

export const totpBucket = new ExpiringTokenBucket<number>(5, 60 * 30);
export const recoveryCodeBucket = new ExpiringTokenBucket<number>(3, 60 * 60);

export function resetUser2FAWithRecoveryCode(userId: number, recoveryCode: string): boolean {
	// Note: In Postgres and MySQL, these queries should be done in a transaction using SELECT FOR UPDATE
	const row = db.queryOne("SELECT recovery_code FROM user WHERE id = ?", [userId]);
	if (row === null) {
		return false;
	}
	const encryptedRecoveryCode = row.bytes(0);
	const userRecoveryCode = decryptToString(encryptedRecoveryCode);
	if (recoveryCode !== userRecoveryCode) {
		return false;
	}

	const newRecoveryCode = generateRandomRecoveryCode();
	const encryptedNewRecoveryCode = encryptString(newRecoveryCode);
	db.execute("UPDATE session SET two_factor_verified = 0 WHERE user_id = ?", [userId]);
	// Compare old recovery code to ensure recovery code wasn't updated.
	const result = db.execute("UPDATE user SET recovery_code = ?, totp_key = NULL WHERE id = ? AND recovery_code = ?", [
		encryptedNewRecoveryCode,
		userId,
		encryptedRecoveryCode
	]);
	return result.changes > 0;
}
