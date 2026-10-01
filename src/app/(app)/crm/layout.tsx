import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "CRM",
};

export default function ModuleLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
