import { LoginForm } from "@/src/components/auth/LoginForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Đăng nhập | finland.vn",
  description: "Đăng nhập vào hệ thống finland.vn",
};

export default function LoginPage() {
  return (
    <div className="flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <LoginForm />
    </div>
  );
}
