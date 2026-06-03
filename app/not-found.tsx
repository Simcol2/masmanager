import Link from "next/link";

export default function NotFoundPage() {
  return (
    <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem", background: "#F8FAFC", color: "#111827" }}>
      <div style={{ maxWidth: "36rem", width: "100%", textAlign: "center", borderRadius: "1rem", background: "#FFFFFF", padding: "2.5rem", boxShadow: "0 20px 50px rgba(15,23,42,0.08)" }}>
        <p style={{ fontSize: "0.85rem", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "#6B7280", margin: 0 }}>404</p>
        <h1 style={{ fontSize: "2rem", fontWeight: 800, margin: "0.75rem 0 1rem", color: "#111827" }}>Page not found</h1>
        <p style={{ fontSize: "1rem", color: "#4B5563", margin: "0 0 1.5rem" }}>
          The page you are looking for does not exist. Use the button below to return to the login screen.
        </p>
        <Link href="/login" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "0.85rem 1.2rem", borderRadius: "0.75rem", background: "#1D4ED8", color: "#FFFFFF", fontWeight: 700, textDecoration: "none" }}>
          Go to Login
        </Link>
      </div>
    </main>
  );
}
