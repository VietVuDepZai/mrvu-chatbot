import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method === "GET") {
    try {
      const { data, error } = await supabase
        .from("Conservations")
        .select("messages, created_at, conservation_id")
        .eq("conservation_id", id)
        .single();
      if (error) throw error;
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: "Không lấy được chi tiết" });
    }
  }

  if (req.method === "PUT") {
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
      res.json({ message: "Cập nhật thành công", data });
    } catch (err) {
      res.status(500).json({ error: "Không cập nhật được" });
    }
  }

  if (req.method === "DELETE") {
    try {
      const { error } = await supabase
        .from("Conservations")
        .delete()
        .eq("conservation_id", id);
      if (error) throw error;
      res.json({ message: "Đã xóa thành công" });
    } catch (err) {
      res.status(500).json({ error: "Không xóa được" });
    }
  }
}
