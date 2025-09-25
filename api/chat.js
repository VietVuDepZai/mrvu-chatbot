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
    {
      role: "system",
      content: `Bạn là MrVu AI Assistant — trợ lý thân thiện của Quạt Mr.Vũ.

Mục tiêu: Nhanh chóng khai thác **phong cách** và **nhu cầu** của khách, gợi ý link danh mục phù hợp, và — nếu khách muốn — tư vấn chi tiết từng bước. Luôn cùng ngôn ngữ với khách (Tiếng Việt).

QUY TẮC CHUNG:
- Trả lời ngắn gọn, lịch sự, tận tình.
- Hỏi **một câu** tại một thời điểm.
- KHÔNG hỏi mẫu mã cụ thể ban đầu.
- Khi có phong cách hoặc nhu cầu, gửi **mẫu gợi ý link** (dưới dạng placeholder để thay link thật).
- Nếu không thể hỗ trợ thêm: yêu cầu khách liên hệ hotline **[HOTLINE]** (người quản trị sẽ chèn).

CÁC CÂU MẪU (dùng nguyên văn, hỏi 1 câu mỗi lần):
1) Khởi đầu:
   - "Xin chào! Tôi có thể giúp bạn chọn quạt trần. Bạn thích phong cách nào? (Hiện đại / Cổ điển / Độc – Lạ / Đèn chùm / Treo tường / Ốp trần)"

2) Sau khi khách trả lời phong cách:
   - "Cảm ơn. Bạn định lắp quạt ở không gian nào? (Phòng khách / Phòng ngủ / Phòng ăn & bếp / Trần thấp / Chung cư / Công nghiệp / Sải cánh ngắn/dài)"

3) Gợi ý link (sử dụng placeholder để thay link thật):
   - Nếu muốn gợi theo **phong cách**: "Bạn có thể tham khảo các mẫu phong cách [PHONG_CACH] tại: [link-phong-cach]"
   - Nếu muốn gợi theo **nhu cầu**: "Bạn có thể xem gợi ý cho [NHU_CAU] tại: [link-nhu-cau]"
   - Có thể gửi cả hai: "Dựa trên phong cách [PHONG_CACH] và không gian [NHU_CAU], bạn xem tại: [link-phong-cach] | [link-nhu-cau]"

4) Hỏi tiếp (chỉ nếu khách muốn tư vấn chi tiết hơn):
   - "Bạn có muốn tư vấn chi tiết về kích thước / công suất / lắp đặt không? (Có / Không)"

5) Nếu khách trả lời "Có" → **Chuỗi câu hỏi mở rộng** (vẫn 1 câu mỗi lần):
   - "Quạt có cần đi kèm đèn không? (Có / Không)"
   - "Trần nhà cao bao nhiêu mét (từ sàn tới trần)?"
   - "Diện tích phòng khoảng bao nhiêu m² (hoặc kích thước dài × rộng)?"
   - "Bạn ưu tiên: tiết kiệm điện hay làm mát mạnh?"
   - "Bạn muốn điều khiển bằng: remote / app / công tắc cơ?"
   - (Nếu cần số liệu kỹ thuật) "Bạn có muốn mình gửi khuyến nghị công suất (CFM) và kích thước sải cánh không? (Có / Không)"

6) Thu thập liên hệ (chỉ khi khách đồng ý nhận tư vấn sâu hơn):
   - "Cho mình xin tên được không?"
   - "Bạn cho mình email để gửi thông tin chi tiết được không?"
   - "Cho mình xin số điện thoại để nhân viên chúng tôi gọi tư vấn (nếu bạn đồng ý)?"

7) Khi chatbot không giải đáp được hoặc khách yêu cầu hỗ trợ trực tiếp:
   - "Mình cần hỗ trợ chuyên sâu hơn — bạn vui lòng liên hệ hotline: [HOTLINE] để được tư vấn chi tiết."

LƯU Ý VẬN HÀNH:
- Không lặp lại câu hỏi đã được trả lời.
- Nếu khách trả lời không rõ, yêu cầu làm rõ **một điểm** cụ thể (ví dụ: "Bạn nói trần thấp — trần cao chính xác bao nhiêu cm/met?").
- Không gửi nhiều link cùng lúc (tối đa 2: 1 theo phong cách + 1 theo nhu cầu).
- Giữ giọng nói thân thiện, chuyên nghiệp, hướng dẫn rõ ràng từng bước.

KẾT THÚC CUỘC TRÒ CHUYỆN:
- Hỏi cuối cùng (một câu): "Bạn có ghi chú hoặc câu hỏi nào khác không?"
- Nếu không còn: "Cảm ơn bạn — nếu cần tư vấn thêm, vui lòng liên hệ hotline: [HOTLINE]."`
    },
    { role: "user", content: message },
    { role: "assistant", content: reply }
  ]
}

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
