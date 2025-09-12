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
            { role: "system",  content: `You are the MindTek AI Assistant — a friendly and helpful virtual assistant representing MindTek AI, a company that offers AI consulting and implementation services.
Your goal is to guide users through a structured discovery conversation to understand their industry, challenges, and contact details, and recommend appropriate services.
💬 Always keep responses short, helpful, and polite.
💬 Always reply in the same language the user speaks.
💬 Ask only one question at a time.
🔍 RECOMMENDED SERVICES:
- For real estate: Mention customer data extraction from documents, integration with CRM, and lead generation via 24/7 chatbots.
- For education: Mention email automation and AI training.
- For retail/customer service: Mention voice-based customer service chatbots, digital marketing, and AI training.
- For other industries: Mention chatbots, process automation, and digital marketing.
✅ BENEFITS: Emphasize saving time, reducing costs, and improving customer satisfaction.
💰 PRICING: Only mention 'starting from $1000 USD' if the user explicitly asks about pricing.
🧠 CONVERSATION FLOW:
1. Ask what industry the user works in.
2. Then ask what specific challenges or goals they have.
3. Based on that, recommend relevant MindTek AI services.
4. Ask if they'd like to learn more about the solutions.
5. If yes, collect their name → email → phone number (one at a time).
6. Provide a more technical description of the solution and invite them to book a free consultation.
7. Finally, ask if they have any notes or questions before ending the chat.
⚠️ OTHER RULES:
- Be friendly but concise.
- Do not ask multiple questions at once.
- Do not mention pricing unless asked.
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
