import { redirect } from "next/navigation";
import LogoutButton from "@/app/components/LogoutButton";
import ProfileSettingsForm from "@/components/profile/ProfileSettingsForm";
import { getCurrentUserWithProfile } from "@/lib/profiles";

export default async function ProfilePage() {
  const { user, profile } = await getCurrentUserWithProfile();

  if (!user) {
    redirect("/login");
  }

  if (!profile) {
    return (
      <main className="container" style={{ padding: "3rem 1rem", maxWidth: 700 }}>
        <h1>Profile</h1>
        <p>We couldn’t load your profile.</p>
      </main>
    );
  }

  return (
    <main
      className="container"
      style={{
        padding: "3rem 1rem",
        maxWidth: 720,
      }}
    >
      <div
        style={{
          borderRadius: "24px",
          border: "1px solid rgba(120, 94, 58, 0.22)",
          background:
            "linear-gradient(180deg, rgba(255,248,235,0.92), rgba(244,232,210,0.82))",
          boxShadow: "0 18px 48px rgba(60, 40, 10, 0.10)",
          padding: "2rem",
          color: "#3e2f1c",
        }}
      >
        <h1 style={{ marginTop: 0 }}>Profile settings</h1>
        <p style={{ opacity: 0.8 }}>{user.email}</p>

        <div style={{ marginTop: "1.5rem" }}>
          <ProfileSettingsForm profile={profile} />
        </div>

        <div style={{ marginTop: "2rem" }}>
          <p style={{ opacity: 0.82, margin: 0 }}>
            Public profile:{" "}
            <a href={`/u/${profile.username}`} className="linkMuted">
              /u/{profile.username}
            </a>
          </p>
        </div>

        <div style={{ marginTop: "1.5rem" }}>
          <LogoutButton email={user.email ?? "Account"} />
        </div>
      </div>
    </main>
  );
}