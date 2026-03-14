import { RegisterForm } from "@/src/components/auth/RegisterForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Đăng ký | finland.vn",
  description: "Đăng ký tài khoản trên hệ thống finland.vn",
};

export default function RegisterPage() {
  return (
    <div className="grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <RegisterForm />
    </div>
  );
}
