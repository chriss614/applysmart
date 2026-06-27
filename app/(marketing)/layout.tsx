import { ReactNode } from "react";
import Navbar from "@/components/landing/navbar";
import Footer from "@/components/landing/footer";

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <Navbar />
      <main>{children}</main>
      <Footer />
    </div>
  );
}
