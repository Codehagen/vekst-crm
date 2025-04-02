import { AppLayout } from "@/components/app-layout";

export default function BusinessesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppLayout>{children}</AppLayout>;
}
