import { notFound } from "next/navigation";
import { getProfileByUsername } from "@/lib/profiles";
import { createClient } from "@/lib/supabase/server";
import StartMessageButton from "@/components/messages/StartMessageButton";

type Props = {
  params: Promise<{ username: string }>;
};

export default async function PublicProfilePage({ params }: Props) {
  const { username } = await params;
  const profile = await getProfileByUsername(username);

  if (!profile || !profile.is_public) {
    notFound();
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isOwnProfile = user?.id === profile.id;

  return (
    <main
      className="container"
      style={{
        padding: "3rem 1rem",
        maxWidth: 700,
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
        <h1 style={{ marginTop: 0 }}>
          {profile.display_name || profile.username}
        </h1>

        <p style={{ opacity: 0.8, marginTop: "0.25rem" }}>
          @{profile.username}
        </p>

        {profile.bio ? (
          <p style={{ marginTop: "1rem", lineHeight: 1.6 }}>{profile.bio}</p>
        ) : (
          <p style={{ marginTop: "1rem", opacity: 0.7 }}>
            No bio provided.
          </p>
        )}

        {isOwnProfile ? (
          <div style={{ marginTop: "1.25rem" }}>
            <a
              href="/profile"
              style={{
                display: "inline-block",
                textDecoration: "none",
                padding: "0.7rem 1rem",
                borderRadius: "999px",
                background: "#1aa0dc",
                color: "white",
                fontWeight: 700,
              }}
            >
              Edit profile
            </a>
          </div>
        ) : profile.allow_messages ? (
          <StartMessageButton username={profile.username} />
        ) : (
          <p style={{ marginTop: "1.25rem", opacity: 0.7 }}>
            This user is not accepting direct messages.
          </p>
        )}
      </div>
    </main>
  );
}