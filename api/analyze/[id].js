import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  // === CORS ===
  res.setHeader("Access-Control-Allow-Origin", "*"); // hoặc domain cụ thể
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end(); // preflight request
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { id } = req.query;

    // 1. Lấy hội thoại từ DB
    const { data, error } = await supabase
      .from("Conservations")
      .select("messages")
      .eq("conservation_id", id)
      .single();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: "Không tìm thấy hội thoại" });

    // 2. Ghép transcript
    const transcript = data.messages
      .map((msg) => `${msg.role}: ${msg.content}`)
      .join("\n");

    // 3. Gọi OpenAI để phân tích
    const completion = await client.chat.completions.create({
      model: "gpt-4.1-nano",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `Extract customer info from the conversation and format as JSON.`,
        },
        { role: "user", content: transcript },
      ],
    });

    const analysis = JSON.parse(completion.choices[0].message.content);

    // 4. Cập nhật DB
    const { error: updateError } = await supabase
      .from("Conservations")
      .update(analysis)
      .eq("conservation_id", id);
    if (updateError) throw updateError;

    res.status(200).json(analysis);
  } catch (err) {
    console.error("❌ Error:", err);
    res.status(500).json({ error: "Không phân tích được" });
  }
}
