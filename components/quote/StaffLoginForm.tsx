"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase";

export default function StaffLoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function login() {
    setLoading(true);
    setMessage("");

    try {
      const supabase = createSupabaseBrowserClient();
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      const { data: profile } = await supabase
        .from("profiles")
        .select("role,is_active")
        .eq("id", data.user.id)
        .single();

      if (!profile?.is_active) {
        await supabase.auth.signOut();
        throw new Error("This staff account is inactive.");
      }

      window.location.href = profile.role === "admin" ? "/admin" : "/bd";
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to sign in.");
      setLoading(false);
    }
  }

  return (
    <div className="login-card">
      <span>STAFF ACCESS</span>
      <h1>Sign in.</h1>
      <p>Admin and business development accounts only.</p>
      <label>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} /></label>
      <label>Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} /></label>
      {message && <p className="form-message">{message}</p>}
      <button type="button" className="button primary" disabled={loading} onClick={login}>{loading ? "Signing in..." : "Sign in"}</button>
    </div>
  );
}
