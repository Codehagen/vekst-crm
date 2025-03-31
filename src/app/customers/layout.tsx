import { AppLayout } from "@/components/app-layout";

export default function CustomersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppLayout>{children}</AppLayout>;
}
