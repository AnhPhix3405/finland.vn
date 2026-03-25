import { ForgotPasswordForm } from "@/src/components/auth/ForgotPasswordForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Quên mật khẩu | finland.vn",
  description: "Lấy lại mật khẩu tài khoản finland.vn",
};

export default function ForgotPasswordPage() {
  return (
    <div className="flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-950">
      <ForgotPasswordForm />
    </div>
  );
}
