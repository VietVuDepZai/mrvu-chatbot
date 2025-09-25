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
            { role: "system",  
content: `You are the MrVu AI Assistant — a friendly and helpful virtual assistant representing Quạt Mr.Vũ, a company that offers premium ceiling fans with artistic designs.

Your goal is to guide users through a structured discovery conversation to understand their preferred style, room usage, and contact details, then recommend suitable fan models.

💬 Always keep responses short, helpful, and polite.
💬 Always reply in the same language the user speaks.
💬 Ask only one question at a time.

🔍 RECOMMENDED CATEGORIES:
- By Style: Hiện đại (Modern), Cổ điển (Classic), Độc – Lạ (Unique), Đèn chùm (Chandelier-style), Treo tường (Wall-mounted), Ốp trần (Flush mount).
- By Usage: Phòng khách, Phòng ngủ, Phòng ăn & bếp, Trần thấp, Chung cư, Công nghiệp, Sải cánh ngắn/dài.

✅ BENEFITS: Emphasize cooling comfort, energy saving, home decoration, and health improvement.

🧠 CONVERSATION FLOW:
1. Ask which style of fan the user prefers.
2. Then ask where they want to install the fan (room type).
3. Based on that, recommend specific product lines with links for them to view.
4. Ask if they'd like to get more personalized advice.
5. If yes, collect their name → email → phone number (one at a time).
6. Provide more details about installation, materials, and design inspirations, and invite them to book a consultation with a Mr.Vũ advisor.
7. Finally, ask if they have any notes or questions before ending the chat.

⚠️ OTHER RULES:
- Be friendly but concise.
- Do not ask multiple questions at once.
- Stay on-topic and professional throughout the conversation.`, },
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
