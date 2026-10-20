import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Câu lạc bộ Dinh dưỡng Herbalife",
  description: "Khám phá sản phẩm dinh dưỡng và kết nối với Câu lạc bộ Dinh dưỡng Herbalife.",
  metadataBase: new URL("https://example.com")
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="vi"><body>{children}</body></html>;
}
