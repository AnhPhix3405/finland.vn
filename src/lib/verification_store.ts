type VerificationCode = {
  code: string;
  expireAt: number;
};

// Use global to handle Next.js hot reloading in development
const globalForVerification = global as unknown as {
  verificationCodes: Map<string, VerificationCode>;
};

export const verificationCodes =
  globalForVerification.verificationCodes || new Map<string, VerificationCode>();

if (process.env.NODE_ENV !== "production") {
  globalForVerification.verificationCodes = verificationCodes;
}
