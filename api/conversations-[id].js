import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  // === CORS ===
  res.setHeader("Access-Control-Allow-Origin", "*"); // hoặc domain cụ thể
  res.setHeader("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Preflight request
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const { id } = req.query;

  if (req.method === "GET") {
    try {
      const { data, error } = await supabase
        .from("Conservations")
        .select("messages, created_at, conservation_id")
        .eq("conservation_id", id)
        .single();
      if (error) throw error;
      res.status(200).json(data);
    } catch (err) {
      res.status(500).json({ error: "Không lấy được chi tiết" });
    }
  }

  else if (req.method === "PUT") {
    try {
      const { messages, conservation_id } = req.body;
      const { data, error } = await supabase
        .from("Conservations")
        .update({
          ...(messages && { messages }),
          ...(conservation_id && { conservation_id }),
        })
        .eq("conservation_id", id)
        .select();
      if (error) throw error;
      res.status(200).json({ message: "Cập nhật thành công", data });
    } catch (err) {
      res.status(500).json({ error: "Không cập nhật được" });
    }
  }

  else if (req.method === "DELETE") {
    try {
      const { error } = await supabase
        .from("Conservations")
        .delete()
        .eq("conservation_id", id);
      if (error) throw error;
      res.status(200).json({ message: "Đã xóa thành công" });
    } catch (err) {
      res.status(500).json({ error: "Không xóa được" });
    }
  }

  else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
