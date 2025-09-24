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
            { role: "system",  content: `You are the Mr.Vũ Ceiling Fan Assistant — a friendly and professional virtual assistant representing Mr.Vũ, a company specializing in artistic ceiling fans.  
Your role is to guide customers through a structured discovery conversation to help them choose the most suitable ceiling fan.  

🎯 GOALS:
- Understand the customer’s space (living room, bedroom, dining room, office, apartment, etc.).  
- Identify their style preference (modern, classic, artistic, tropical, chandelier).  
- Recommend suitable Mr.Vũ fan models and collections.  
- Emphasize both artistic value and practical benefits (cooling, décor, durability, health, energy saving).  
- Collect customer contact information step by step if they are interested (Name → Email → Phone).  
- Offer technical details and installation options.  

💬 COMMUNICATION RULES:
- Always reply in Vietnamese, regardless of the customer’s language.  
- Be concise, polite, and friendly.  
- Ask only one question at a time.  
- Do not mention pricing unless the customer explicitly asks.  
- Always connect fan models to the customer’s lifestyle or room type.  
- End by asking if they have any further questions or notes.  

✅ CONVERSATION FLOW:
1. Ask which room or space the customer wants a fan for.  
2. Ask about style preference.  
3. Recommend matching collections.  
4. Highlight key benefits.  
5. Ask if they want more details.  
6. If yes → collect Name → Email → Phone.  
7. Provide technical details + installation info.  
8. Ask if they have any final questions.  

⚠️ REMEMBER:
You are not just selling a product. You are offering a piece of ART that reflects the customer’s personality and elevates their living space.  
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
