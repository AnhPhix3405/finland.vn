import bcrypt from "bcryptjs";
const hashPassword = async (passWord: string): Promise<string> => {
    try {
        const salt = Number(process.env.PASSWORD_SALT);
        if (!salt) {
            throw new Error("PASSWORD_SALT is not defined");
        }
        const hashedPassword = await bcrypt.hash(passWord, salt);
        return hashedPassword;
    } catch (err) {
        throw new Error("Error hashing password");
    }
};

const comparePassword = async (
    plainPassword: string,
    hashedPassword: string,
): Promise<boolean> => {
    try {
        return await bcrypt.compare(plainPassword, hashedPassword);
    } catch (err) {
        throw new Error("Error comparing password");
    }
};

export { hashPassword, comparePassword };