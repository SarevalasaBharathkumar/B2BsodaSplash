"use client";

import { useEffect, useState } from "react";
import { stageLabels } from "@/lib/config";
import { formatINR } from "@/lib/flavours";
import { createSupabaseBrowserClient } from "@/lib/supabase";

type StaffRole = "admin" | "bd";

type DashboardQuote = {
  id: string;
  quote_number: string;
  customer_name: string;
  business_name?: string;
  business_type: string;
  status: keyof typeof stageLabels;
  total: number;
  latest_invoice_number?: string | null;
  invoice_version?: number;
};

type TeamMember = {
  id: string;
  email: string;
  full_name?: string | null;
  role: StaffRole;
  is_active: boolean;
};

type Product = {
  id: string;
  name: string;
  description?: string | null;
  image_url?: string | null;
  display_order: number;
  is_active: boolean;
};

type Flavour = {
  id: string;
  product_id?: string | null;
  name: string;
  note?: string | null;
  price_per_case: number;
  color: string;
  display_order: number;
  is_active: boolean;
};

type DashboardData = {
  profile: { full_name?: string; role: StaffRole };
  quotes: DashboardQuote[];
  metrics: { total: number; open: number; delivered: number; revenue: number };
  team?: TeamMember[];
  products?: Product[];
  flavours?: Flavour[];
};

type DashboardSection = "dashboard" | "orders" | "team" | "products" | "flavours";

async function getAccessToken() {
  const supabase = createSupabaseBrowserClient();
  const { data: sessionData } = await supabase.auth.getSession();
  return sessionData.session?.access_token;
}

export default function StaffDashboard({ requiredRole }: { requiredRole: StaffRole }) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [message, setMessage] = useState("Loading staff workspace...");
  const [saving, setSaving] = useState("");
  const [activeSection, setActiveSection] = useState<DashboardSection>(() => {
    if (typeof window === "undefined") return "dashboard";
    const saved = window.sessionStorage.getItem(`dashboardSection:${requiredRole}`) as DashboardSection | null;
    const allowed: DashboardSection[] = requiredRole === "admin" ? ["dashboard", "orders", "team", "products", "flavours"] : ["dashboard", "orders"];
    return saved && allowed.includes(saved) ? saved : "dashboard";
  });
  const [teamForm, setTeamForm] = useState({ fullName: "", email: "", password: "", role: "bd" as StaffRole });
  const [productForm, setProductForm] = useState({ name: "", description: "", imageUrl: "", displayOrder: 0 });
  const [flavourForm, setFlavourForm] = useState({ productId: "", name: "", note: "", pricePerCase: 0, color: "#2e6fb8", displayOrder: 0 });

  async function load() {
    try {
      const token = await getAccessToken();

      if (!token) {
        window.location.href = "/login";
        return;
      }

      const response = await fetch("/api/staff/dashboard", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await response.json();

      if (!response.ok) throw new Error(result.error || "Unable to load dashboard.");
      if (result.profile.role !== requiredRole) {
        window.location.href = result.profile.role === "admin" ? "/admin" : "/bd";
        return;
      }

      setData(result);
      setMessage("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to load dashboard.");
    }
  }

  useEffect(() => {
    load();
  }, [requiredRole]);

  useEffect(() => {
    window.sessionStorage.setItem(`dashboardSection:${requiredRole}`, activeSection);
  }, [activeSection, requiredRole]);

  useEffect(() => {
    if (!message || message === "Loading staff workspace...") return;
    const timer = window.setTimeout(() => setMessage(""), 4000);
    return () => window.clearTimeout(timer);
  }, [message]);

  async function signOut() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  async function adminRequest(path: string, method: "POST" | "PATCH" | "DELETE", body: unknown) {
    const token = await getAccessToken();
    if (!token) throw new Error("Login required.");

    const response = await fetch(path, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(body)
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Request failed.");
    await load();
    return result;
  }

  async function createTeamMember() {
    setSaving("team");
    setMessage("");
    try {
      await adminRequest("/api/admin/team", "POST", teamForm);
      setTeamForm({ fullName: "", email: "", password: "", role: "bd" });
      setMessage("Team member created.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to create team member.");
    } finally {
      setSaving("");
    }
  }

  async function createProduct() {
    setSaving("product");
    setMessage("");
    try {
      await adminRequest("/api/admin/products", "POST", productForm);
      setProductForm({ name: "", description: "", imageUrl: "", displayOrder: 0 });
      setMessage("Product created.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to create product.");
    } finally {
      setSaving("");
    }
  }

  async function createFlavour() {
    setSaving("flavour");
    setMessage("");
    try {
      await adminRequest("/api/admin/flavours", "POST", flavourForm);
      setFlavourForm({ productId: "", name: "", note: "", pricePerCase: 0, color: "#2e6fb8", displayOrder: 0 });
      setMessage("Flavour created.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to create flavour.");
    } finally {
      setSaving("");
    }
  }

  async function updateFlavour(flavour: Flavour, patch: Partial<Flavour>) {
    setSaving(flavour.id);
    setMessage("");
    try {
      await adminRequest("/api/admin/flavours", "PATCH", {
        id: flavour.id,
        productId: patch.product_id ?? flavour.product_id ?? "",
        name: patch.name ?? flavour.name,
        note: patch.note ?? flavour.note ?? "",
        pricePerCase: patch.price_per_case ?? flavour.price_per_case,
        color: patch.color ?? flavour.color,
        displayOrder: patch.display_order ?? flavour.display_order,
        isActive: patch.is_active ?? flavour.is_active
      });
      setMessage("Flavour updated.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to update flavour.");
    } finally {
      setSaving("");
    }
  }

  async function updateTeamMember(member: TeamMember, patch: Partial<TeamMember>) {
    setSaving(member.id);
    setMessage("");
    try {
      await adminRequest("/api/admin/team", "PATCH", {
        id: member.id,
        fullName: patch.full_name ?? member.full_name ?? "",
        role: patch.role ?? member.role,
        isActive: patch.is_active ?? member.is_active
      });
      setMessage("Team member updated.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to update team member.");
    } finally {
      setSaving("");
    }
  }

  async function updateProduct(product: Product, patch: Partial<Product>) {
    setSaving(product.id);
    setMessage("");
    try {
      await adminRequest("/api/admin/products", "PATCH", {
        id: product.id,
        name: patch.name ?? product.name,
        description: patch.description ?? product.description ?? "",
        imageUrl: patch.image_url ?? product.image_url ?? "",
        displayOrder: patch.display_order ?? product.display_order,
        isActive: patch.is_active ?? product.is_active
      });
      setMessage("Product updated.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to update product.");
    } finally {
      setSaving("");
    }
  }

  async function deleteProduct(product: Product) {
    setSaving(product.id);
    setMessage("");
    try {
      await adminRequest("/api/admin/products", "DELETE", { id: product.id });
      setMessage("Product deleted.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to delete product. Pause it if existing orders reference it.");
    } finally {
      setSaving("");
    }
  }

  async function deleteFlavour(flavour: Flavour) {
    setSaving(flavour.id);
    setMessage("");
    try {
      await adminRequest("/api/admin/flavours", "DELETE", { id: flavour.id });
      setMessage("Flavour deleted.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to delete flavour. Pause it if existing orders reference it.");
    } finally {
      setSaving("");
    }
  }

  const isAdmin = requiredRole === "admin";
  const navItems: Array<{ id: DashboardSection; label: string }> = [
    { id: "dashboard", label: "Dashboard" },
    { id: "orders", label: isAdmin ? "All orders" : "My orders" },
    ...(isAdmin
      ? [
          { id: "team" as const, label: "Team" },
          { id: "products" as const, label: "Products" },
          { id: "flavours" as const, label: "Flavours" }
        ]
      : [])
  ];

  return (
    <main className="dashboard-page">
      <aside className="dashboard-sidebar">
        <a href="/"><img src="/assets/logo.png" alt="SodaSplash" /></a>
        <span>{isAdmin ? "ADMIN" : "BUSINESS DEVELOPMENT"}</span>
        <nav>
          {navItems.map((item) => (
            <button
              type="button"
              className={`nav-tab ${activeSection === item.id ? "active" : ""}`}
              aria-current={activeSection === item.id ? "page" : undefined}
              onClick={() => setActiveSection(item.id)}
              key={item.id}
            >
              {item.label}
            </button>
          ))}
          <a href="/quote">Submit customer order</a>
          <button type="button" className="sign-out-button" onClick={signOut}>Sign out</button>
        </nav>
      </aside>
      <section className="dashboard-content">
        <header><div><span>{isAdmin ? "FOUNDER CONTROL PANEL" : "SALES WORKSPACE"}</span><h1>{isAdmin ? "Operations dashboard." : "Your customers."}</h1></div><a className="button primary" href="/quote">New quote</a></header>
        {!data ? (
          <div className="setup-card"><h2>{message}</h2><p>Staff data is protected by your Supabase session and role.</p></div>
        ) : (
          <>
            {activeSection === "dashboard" && (
              <div className={`metric-grid ${isAdmin ? "" : "three"}`}>
                <article><span>{isAdmin ? "Total quotes" : "Referred orders"}</span><strong>{data.metrics.total}</strong></article>
                <article><span>Open orders</span><strong>{data.metrics.open}</strong></article>
                {isAdmin && <article><span>Delivered</span><strong>{data.metrics.delivered}</strong></article>}
                <article><span>{isAdmin ? "Delivered revenue" : "Delivered referral value"}</span><strong>{formatINR(data.metrics.revenue)}</strong></article>
              </div>
            )}

            {message && <div className="form-message dashboard-message">{message}</div>}

            {activeSection === "orders" && <section className="dashboard-table" id="orders">
              <div className="table-title"><h2>{isAdmin ? "Recent orders" : "Assigned orders"}</h2><input placeholder="Search orders" /></div>
              <div className={`table-row table-head ${isAdmin ? "" : "bd-table"}`}><span>Quote</span><span>Customer</span><span>Business</span><span>Status</span><span>Total</span><span>Action</span></div>
              {data.quotes.map((quote) => (
                <div className={`table-row ${isAdmin ? "" : "bd-table"}`} key={quote.id}>
                  <strong>{quote.quote_number}</strong>
                  <span>{quote.customer_name}{!isAdmin && <small>{quote.business_name}</small>}</span>
                  <span>{quote.business_name || quote.business_type}</span>
                  <span className={`status status-${quote.status}`}>{stageLabels[quote.status]}</span>
                  <strong>
                    {formatINR(quote.total)}
                    <small>{quote.latest_invoice_number || (quote.invoice_version ? `Invoice v${quote.invoice_version}` : "No invoice yet")}</small>
                  </strong>
                  <a className="table-action" href={`/orders/${quote.quote_number}`}>Edit</a>
                </div>
              ))}
            </section>}

            {isAdmin && activeSection === "team" && (
              <>
                <section className="admin-grid" id="team">
                  <div className="setup-card">
                    <span>TEAM</span>
                    <h2>Add staff user</h2>
                    <div className="form-grid admin-form">
                      <label>Full name<input value={teamForm.fullName} onChange={(event) => setTeamForm({ ...teamForm, fullName: event.target.value })} /></label>
                      <label>Email<input type="email" value={teamForm.email} onChange={(event) => setTeamForm({ ...teamForm, email: event.target.value })} /></label>
                      <label>Password<input type="password" value={teamForm.password} onChange={(event) => setTeamForm({ ...teamForm, password: event.target.value })} /></label>
                      <label>Role<select value={teamForm.role} onChange={(event) => setTeamForm({ ...teamForm, role: event.target.value as StaffRole })}><option value="bd">BD</option><option value="admin">Admin</option></select></label>
                    </div>
                    <button type="button" className="button primary" disabled={saving === "team"} onClick={createTeamMember}>{saving === "team" ? "Creating..." : "Create user"}</button>
                  </div>
                  <div className="dashboard-table compact-table">
                    <div className="table-title"><h2>Current team</h2></div>
                    {data.team?.map((member) => (
                      <div className="table-row team-row" key={member.id}>
                        <strong>{member.full_name || member.email}<small>{member.email}</small></strong>
                        <span>{member.role.toUpperCase()}</span>
                        <span className={`status ${member.is_active ? "status-delivered" : "status-cancelled"}`}>{member.is_active ? "Active" : "Inactive"}</span>
                        <button type="button" className="table-action" disabled={saving === member.id} onClick={() => updateTeamMember(member, { role: member.role === "admin" ? "bd" : "admin" })}>{member.role === "admin" ? "Make BD" : "Make admin"}</button>
                        <button type="button" className="table-action" disabled={saving === member.id} onClick={() => updateTeamMember(member, { is_active: !member.is_active })}>{member.is_active ? "Deactivate" : "Activate"}</button>
                      </div>
                    ))}
                  </div>
                </section>
              </>
            )}

            {isAdmin && activeSection === "products" && (
              <>
                <section className="admin-grid" id="products">
                  <div className="setup-card">
                    <span>PRODUCTS</span>
                    <h2>Add product</h2>
                    <div className="form-grid admin-form">
                      <label>Name<input value={productForm.name} onChange={(event) => setProductForm({ ...productForm, name: event.target.value })} /></label>
                      <label>Display order<input type="number" min="0" value={productForm.displayOrder} onChange={(event) => setProductForm({ ...productForm, displayOrder: Number(event.target.value) })} /></label>
                      <label className="full">Product image URL<input value={productForm.imageUrl} onChange={(event) => setProductForm({ ...productForm, imageUrl: event.target.value })} /></label>
                      <label className="full">Description<textarea value={productForm.description} onChange={(event) => setProductForm({ ...productForm, description: event.target.value })} /></label>
                    </div>
                    <button type="button" className="button primary" disabled={saving === "product"} onClick={createProduct}>{saving === "product" ? "Creating..." : "Create product"}</button>
                  </div>
                  <div className="dashboard-table compact-table">
                    <div className="table-title"><h2>Products</h2></div>
                    {data.products?.map((product) => (
                      <div className="table-row product-row" key={product.id}>
                        <strong>{product.name}<small>{product.description || "No description"}</small></strong>
                        <input defaultValue={product.image_url ?? ""} placeholder="Image URL" onBlur={(event) => updateProduct(product, { image_url: event.target.value })} />
                        <input type="number" min="0" defaultValue={product.display_order} onBlur={(event) => updateProduct(product, { display_order: Number(event.target.value) })} />
                        <span className={`status ${product.is_active ? "status-delivered" : "status-cancelled"}`}>{product.is_active ? "Active" : "Inactive"}</span>
                        <button type="button" className="table-action" disabled={saving === product.id} onClick={() => updateProduct(product, { is_active: !product.is_active })}>{product.is_active ? "Pause" : "Activate"}</button>
                        <button type="button" className="table-action danger-action" disabled={saving === product.id} onClick={() => deleteProduct(product)}>Delete</button>
                      </div>
                    ))}
                  </div>
                </section>
              </>
            )}

            {isAdmin && activeSection === "flavours" && (
              <>
                <section className="setup-card" id="flavours">
                  <span>FLAVOURS</span>
                  <h2>Add flavour and pricing</h2>
                  <div className="form-grid admin-form">
                    <label>Product<select value={flavourForm.productId} onChange={(event) => setFlavourForm({ ...flavourForm, productId: event.target.value })}><option value="">Default product</option>{data.products?.map((product) => <option value={product.id} key={product.id}>{product.name}</option>)}</select></label>
                    <label>Name<input value={flavourForm.name} onChange={(event) => setFlavourForm({ ...flavourForm, name: event.target.value })} /></label>
                    <label>Price per case<input type="number" value={flavourForm.pricePerCase} onChange={(event) => setFlavourForm({ ...flavourForm, pricePerCase: Number(event.target.value) })} /></label>
                    <label>Color<input type="color" value={flavourForm.color} onChange={(event) => setFlavourForm({ ...flavourForm, color: event.target.value })} /></label>
                    <label>Display order<input type="number" value={flavourForm.displayOrder} onChange={(event) => setFlavourForm({ ...flavourForm, displayOrder: Number(event.target.value) })} /></label>
                    <label>Note<input value={flavourForm.note} onChange={(event) => setFlavourForm({ ...flavourForm, note: event.target.value })} /></label>
                  </div>
                  <button type="button" className="button primary" disabled={saving === "flavour"} onClick={createFlavour}>{saving === "flavour" ? "Creating..." : "Create flavour"}</button>
                </section>

                <section className="dashboard-table compact-table">
                  <div className="table-title"><h2>Flavour pricing</h2></div>
                  {data.flavours?.map((flavour) => (
                    <div className="table-row flavour-admin-row" key={flavour.id}>
                      <span className="flavour-dot" style={{ background: flavour.color }} />
                      <strong>{flavour.name}<small>{flavour.note || "No note"}</small></strong>
                      <select defaultValue={flavour.product_id ?? ""} onChange={(event) => updateFlavour(flavour, { product_id: event.target.value })}>
                        <option value="">No product</option>
                        {data.products?.map((product) => <option value={product.id} key={product.id}>{product.name}</option>)}
                      </select>
                      <input type="number" defaultValue={flavour.price_per_case} onBlur={(event) => updateFlavour(flavour, { price_per_case: Number(event.target.value) })} />
                      <button type="button" className="table-action" disabled={saving === flavour.id} onClick={() => updateFlavour(flavour, { is_active: !flavour.is_active })}>{flavour.is_active ? "Pause" : "Activate"}</button>
                      <button type="button" className="table-action danger-action" disabled={saving === flavour.id} onClick={() => deleteFlavour(flavour)}>Delete</button>
                    </div>
                  ))}
                </section>
              </>
            )}
          </>
        )}
      </section>
    </main>
  );
}
