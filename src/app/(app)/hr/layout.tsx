import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Human Resources",
};

export default function ModuleLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
