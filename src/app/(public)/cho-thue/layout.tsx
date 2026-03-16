import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cho Thuê Bất Động Sản | Finland.vn",
  description: "Tìm kiếm hàng ngàn tin đăng cho thuê bất động sản chính chủ, uy tín toàn quốc.",
  keywords: "cho thuê bất động sản, cho thuê nhà, cho thuê căn hộ, cho thuê đất, bất động sản cho thuê",
};

export default function ChoThueLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
