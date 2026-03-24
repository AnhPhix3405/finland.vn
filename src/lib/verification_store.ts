type VerificationCode = {
  code: string;
  expireAt: number;
};

type ResetToken = {
  token: string;
  expireAt: number;
};

// Use global to handle Next.js hot reloading in development
const globalForVerification = global as unknown as {
  verificationCodes: Map<string, VerificationCode>;
  resetTokens: Map<string, ResetToken>;
};

export const verificationCodes =
  globalForVerification.verificationCodes || new Map<string, VerificationCode>();

export const resetTokens =
  globalForVerification.resetTokens || new Map<string, ResetToken>();

if (process.env.NODE_ENV !== "production") {
  globalForVerification.verificationCodes = verificationCodes;
  globalForVerification.resetTokens = resetTokens;
}
