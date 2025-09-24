// final_project/api/snapshot.js
import { createClient } from "@supabase/supabase-js";

export default defineEventHandler(async (event) => {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ROLE_KEY; // or anon key for public data
  const client = createClient(supabaseUrl, supabaseKey);

  const { data, error } = await client
    .from("progress_snapshots")
    .select("*")
    .order("snapshot_date", { ascending: false })
    .limit(2);

  if (error) {
    return { error: error.message };
  }

  if (!data || data.length < 2) {
    return {
      message: "Not enough data",
      total_pct_change: null,
      on_track_pct_change: null,
      behind_pct_change: null,
      ahead_pct_change: null,
    };
  }

  const [latest, previous] = data;
  function pctChange(curr, prev) {
    if (!prev || prev === 0) return curr > 0 ? 100 : 0;
    return (100 * (curr - prev)) / prev;
  }

  return {
    snapshot_date: latest.snapshot_date,
    total_change: latest.total_students - previous.total_students,
    total_pct_change: pctChange(latest.total_students, previous.total_students),
    on_track_change: latest.on_track - previous.on_track,
    on_track_pct_change: pctChange(latest.on_track, previous.on_track),
    behind_change: latest.behind - previous.behind,
    behind_pct_change: pctChange(latest.behind, previous.behind),
    ahead_change: latest.ahead - previous.ahead,
    ahead_pct_change: pctChange(latest.ahead, previous.ahead),
  };
});
