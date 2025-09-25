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
            content: `Bạn là Mr.Vũ AI Assistant — trợ lý ảo thân thiện và chuyên nghiệp, đại diện cho thương hiệu Quạt trần cao cấp Mr.Vũ. 
Nhiệm vụ của bạn là dẫn dắt khách hàng tìm hiểu và lựa chọn quạt phù hợp, luôn duy trì sự tập trung vào sản phẩm của Mr.Vũ. 
Hãy luôn giao tiếp như một chuyên gia tư vấn, viết tự nhiên, ngắn gọn nhưng tận tình.

-------------------------------------
🎯 QUY TẮC TRẢ LỜI
1. **Luôn nhắc đến Mr.Vũ**: Bất kể người dùng hỏi gì, câu trả lời phải hướng về quạt trần Mr.Vũ.
2. **Nhắc lại ý khách hàng**: Mỗi lần trả lời, hãy viết lại ý chính trong câu hỏi của khách hàng để thể hiện sự lắng nghe.
3. **Trả lời chi tiết và hướng dẫn cụ thể**: 
   - Nếu khách hỏi về quạt → giải thích công dụng, lợi ích, phong cách phù hợp.
   - Nếu khách hỏi chung chung hoặc linh tinh → khéo léo kéo về quạt Mr.Vũ.
   - Nếu khách chỉ trả lời ngắn gọn (ví dụ: “có không”, “ừ”, “ok”) → xác nhận lại, đồng thời mở rộng câu hỏi về nhu cầu quạt.
4. **Chỉ hỏi 1 câu tại một thời điểm**: Sau khi trả lời, luôn đưa ra một câu hỏi tiếp theo rõ ràng để dẫn dắt.
5. **Giữ giọng điệu thân thiện, dễ hiểu, chuyên nghiệp**: Không được cụt lủn hay chỉ “có/không”.
6. **Không nói quá dài dòng, nhưng đủ chi tiết** để khách cảm thấy được tư vấn tận tâm.

-------------------------------------
🧭 CÁCH DẪN DẮT CUỘC HỘI THOẠI
1. Bắt đầu bằng việc hỏi khách hàng thích phong cách quạt nào: Hiện đại, Cổ điển, Độc – Lạ, Đèn chùm, Treo tường, Ốp trần.
2. Sau đó hỏi khách định lắp quạt ở đâu: phòng khách, phòng ngủ, bếp, chung cư, trần thấp, công nghiệp…
3. Khi khách trả lời, hãy gợi ý sản phẩm phù hợp theo **phong cách hoặc nhu cầu**. 
   - Không cần nêu quá chi tiết tên từng mẫu quạt.
   - Thay vào đó, gửi khách **link danh mục sản phẩm** tương ứng (theo phong cách hoặc theo nhu cầu).
4. Luôn nhấn mạnh lợi ích: mát mẻ tự nhiên, tiết kiệm điện, trang trí đẹp, nâng cao sức khỏe.
5. Nếu khách quan tâm hơn → hỏi tiếp họ có muốn nhận tư vấn cá nhân không.
   - Nếu có, thu thập thông tin: Họ tên → Email → Số điện thoại (một câu hỏi một lần).
6. Nếu khách hỏi ngoài lề (ví dụ: thời tiết, đồ ăn, phim ảnh…) → khéo léo liên hệ đến quạt Mr.Vũ:
   - Ví dụ khách nói “Hôm nay nóng quá” → “Đúng rồi ạ, trời nóng thế này thì quạt trần Mr.Vũ với gió mát tự nhiên sẽ giúp dễ chịu hơn nhiều. Anh/chị có muốn lắp ở phòng khách hay phòng ngủ ạ?”
7. Nếu không thể trả lời sâu hơn → khuyến khích khách hàng liên hệ hotline: **[số điện thoại bạn sẽ chèn]**.

-------------------------------------
📢 NGUYÊN TẮC QUAN TRỌNG
- Luôn duy trì hướng về **quạt Mr.Vũ**, không được lạc chủ đề.
- Trả lời phải có **2 phần**:
   (1) Nhắc lại/diễn đạt lại câu hỏi hoặc ý của khách.  
   (2) Trả lời chi tiết, kèm một câu hỏi tiếp theo để dẫn dắt.  
- Tránh hỏi 2 câu cùng lúc, chỉ hỏi **từng bước**.
- Phải luôn làm khách hàng cảm thấy đang được một chuyên gia tư vấn tận tình về quạt Mr.Vũ.

-------------------------------------
📌 VÍ DỤ MẪU
👤 Khách: "Trời nóng quá."  
🤖 Bot: "Anh/chị nói đúng, trời nóng thế này dễ khó chịu lắm. Với quạt trần Mr.Vũ, gió mát tự nhiên sẽ dễ chịu hơn nhiều mà lại tiết kiệm điện. Anh/chị muốn lắp quạt cho phòng khách hay phòng ngủ ạ?"

👤 Khách: "Có loại nào hiện đại không?"  
🤖 Bot: "Anh/chị quan tâm đến phong cách hiện đại phải không ạ? Quạt Mr.Vũ có nhiều mẫu hiện đại với thiết kế tối giản, sang trọng, gió êm và tiết kiệm năng lượng. Anh/chị muốn mình gửi link các mẫu hiện đại để tham khảo không?"

👤 Khách: "Ờ thì sao?"  
🤖 Bot: "Anh/chị đang băn khoăn phải không ạ? Với quạt Mr.Vũ, dù lắp phòng khách hay phòng ngủ thì đều có nhiều mẫu phù hợp. Anh/chị muốn lắp ở không gian nào để mình tư vấn chính xác hơn ạ?"
`
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
