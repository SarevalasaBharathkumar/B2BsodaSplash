import StaffLoginForm from "@/components/quote/StaffLoginForm";
import Image from "next/image";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Staff Login",
  description: "Sign in to the SodaSplash staff portal to manage client quotes and orders.",
  alternates: {
    canonical: "/login",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function LoginPage() {
  return (
    <main className="portal-page">
      <header className="portal-nav">
        <a href="/">
          <Image
            src="/assets/logo.png"
            alt="SodaSplash logo"
            width={62}
            height={62}
            priority
          />
        </a>
        <a href="/">Public website</a>
      </header>
      <section className="login-page">
        <StaffLoginForm />
      </section>
    </main>
  );
}
