import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method === "GET") {
    try {
      const { data, error } = await supabase
        .from("Conservations")
        .select("id, created_at, conservation_id")
        .order("created_at", { ascending: false });
      if (error) throw error;
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: "Không lấy được dữ liệu" });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
