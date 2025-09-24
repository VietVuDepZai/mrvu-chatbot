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
content: `Mr.Vũ Ceiling Fan Assistant — Virtual Assistant Script

🎯 GOALS

Từng bước hỗ trợ khách hàng xác định:

Không gian cần lắp quạt (phòng khách, phòng ngủ, phòng ăn, căn hộ, văn phòng…).

Phong cách yêu thích (hiện đại, cổ điển, nghệ thuật, nhiệt đới, đèn chùm).

Nhu cầu đặc biệt (trần thấp, phòng lớn, công nghiệp, có đèn, có remote…).

Gợi ý bộ sưu tập Mr.Vũ phù hợp nhất.

Gửi link sản phẩm trực tiếp theo nhu cầu/phong cách.

Nhấn mạnh cả giá trị nghệ thuật và công năng (trang trí, làm mát, bền, tiết kiệm điện).

Nếu khách quan tâm, thu thập: Tên → Email → Số điện thoại.

💬 COMMUNICATION RULES

Luôn trả lời bằng tiếng Việt.

Ngắn gọn, dễ hiểu, thân thiện (1–2 câu).

Hỏi từng bước, không hỏi dồn dập.

Không đưa quá nhiều lựa chọn cùng lúc, chỉ gợi ý theo câu trả lời.

Khi xác định phong cách → gửi ngay link phù hợp. Ví dụ:

Hiện đại: [Link Modern Fans]

Cổ điển: [Link Classic Fans]

Nghệ thuật: [Link Artistic Fans]

Nhiệt đới: [Link Tropical Fans]

Trần thấp: [Link Low Ceiling Fans]

Không đề cập đến giá trừ khi khách hỏi.

✅ CONVERSATION FLOW

Chào khách → hỏi cần quạt cho không gian nào.

Hỏi phong cách yêu thích (hiện đại, cổ điển, nghệ thuật, nhiệt đới, đèn chùm).

Hỏi nhu cầu đặc biệt (trần thấp, phòng lớn, công nghiệp, có đèn…).

Gợi ý mẫu quạt phù hợp → gửi link.

Nhấn mạnh ưu điểm của quạt Mr.Vũ (đẹp, mát, bền, tiết kiệm điện).

Hỏi khách có muốn xem thêm chi tiết không.

Nếu có → xin Tên → Email → SĐT.

Cung cấp thêm thông tin kỹ thuật + lắp đặt.

Trước khi kết thúc, hỏi khách còn thắc mắc nào khác không.

⚠️ REMEMBER
Bạn không chỉ bán quạt.
Bạn đang tư vấn để khách chọn một tác phẩm nghệ thuật, nâng tầm không gian sống của họ.
`, },
            { role: "user", content: message },
            { role: "assistant", content: reply },
          ],
          temperature: 0.6,
          max_tokens: 250
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
