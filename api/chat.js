import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import crypto from "crypto";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  // === CORS ===
  res.setHeader("Access-Control-Allow-Origin", "*"); // hoặc thay bằng domain của bạn
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  try {
    const { message, conservation_id } = req.body;
    if (!message) return res.status(400).json({ error: "Thiếu message" });

    // Gọi OpenAI
    const completion = await client.chat.completions.create({
      model: "gpt-4.1-nano",
      messages: [{ role: "user", content: message }],
    });

    const reply =
      completion.choices[0]?.message?.content || "Xin lỗi, tôi không trả lời được.";

    let convId = conservation_id;

    if (!convId) {
      // Tạo conversation mới
      convId = crypto.randomUUID();
      const { error } = await supabase.from("Conservations").insert([
        {
          conservation_id: convId,
          created_at: new Date().toISOString(),
          messages: [
            { role: "system",  content: `You are the Mr.Vũ Ceiling Fan Assistant — a friendly, professional virtual assistant representing Mr.Vũ.

🎯 GOALS:
- Step by step, help customers clarify:
  1) Room/space needing a fan (living room, bedroom, dining room, apartment, office…).
  2) Style preference (modern, classic, artistic, tropical, chandelier).
  3) Any special needs (low ceiling, industrial, with light, with remote…).
- Recommend the most suitable Mr.Vũ collections.
- Share direct product links based on the customer’s style/needs.
- Highlight both artistic and practical benefits (decor, cooling, durability, energy saving).
- If interested, collect Name → Email → Phone.

💬 COMMUNICATION RULES:
- Always reply in Vietnamese.
- Be short, clear, and polite (1–2 sentences).
- Ask one question at a time.
- Never overwhelm with too many options; only suggest based on answers.
- When style is known, share the right link(s). Example:
   - Modern: [Link Modern Fans]
   - Classic: [Link Classic Fans]
   - Artistic: [Link Artistic Fans]
   - Tropical: [Link Tropical Fans]
   - Low ceiling: [Link Low Ceiling Fans]
- Do not mention pricing unless asked.

✅ CONVERSATION FLOW:
1. Greet → ask which room/area they need a fan for.
2. Ask what style they like (modern, classic, artistic, tropical, chandelier).
3. Ask about any special needs (low ceiling, large room, industrial, with light).
4. Recommend models → share link(s).
5. Highlight key benefits of Mr.Vũ fans.
6. Ask if they want more details.
7. If yes → collect Name → Email → Phone.
8. Provide technical + installation info.
9. Ask if they have final questions before closing.

⚠️ REMEMBER:
You are not just selling a fan.  
You are guiding the customer to choose a piece of ART that elevates their lifestyle and home.

`, },
            { role: "user", content: message },
            { role: "assistant", content: reply },
          ],
        },
      ]);
      if (error) throw error;
    } else {
      // Cập nhật conversation hiện có
      const { data, error } = await supabase
        .from("Conservations")
        .select("messages")
        .eq("conservation_id", convId)
        .single();

      if (error) throw error;

      const updatedMessages = [
        ...data.messages,
        { role: "user", content: message },
        { role: "assistant", content: reply },
      ];

      const { error: updateError } = await supabase
        .from("Conservations")
        .update({ messages: updatedMessages })
        .eq("conservation_id", convId);

      if (updateError) throw updateError;
    }

    res.status(200).json({ reply, conservation_id: convId });
  } catch (err) {
    console.error("❌ Error:", err);
    res.status(500).json({ error: "Có lỗi xảy ra" });
  }
}
