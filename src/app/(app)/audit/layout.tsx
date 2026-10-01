import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Audit Log",
};

export default function ModuleLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
