import StaffLoginForm from "@/components/quote/StaffLoginForm";

export const metadata = {
  title: "Staff Login | SodaSplash"
};

export default function LoginPage() {
  return (
    <main className="portal-page">
      <header className="portal-nav">
        <a href="/"><img src="/assets/logo.png" alt="SodaSplash" /></a>
        <a href="/">Public website</a>
      </header>
      <section className="login-page">
        <StaffLoginForm />
      </section>
    </main>
  );
}
