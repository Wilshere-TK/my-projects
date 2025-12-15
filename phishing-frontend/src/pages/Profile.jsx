import { useEffect, useState } from "react";
import api from "../api/axiosInstance";

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const res = await api.get("/api/me");
        if (!mounted) return;
        setProfile(res.data);
      } catch (e) {
        // ignore — user might not be authenticated
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  if (loading) return <div className="card p-4">Loading profile...</div>;
  if (!profile) return <div className="card p-4">No profile available.</div>;

  return (
    <div className="card p-4">
      <h2>Profile</h2>
      <p><strong>Username:</strong> {profile.username || profile.name || '—'}</p>
      <p><strong>Email:</strong> {profile.email || '—'}</p>
      <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(profile, null, 2)}</pre>
    </div>
  );
}
