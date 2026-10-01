import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Space",
  description:
    "Personal landing page: profile, leave balance, attendance, quick actions and recent activity.",
};

export default function MySpaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
