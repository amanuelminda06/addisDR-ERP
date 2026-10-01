import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Finance",
};

export default function ModuleLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
