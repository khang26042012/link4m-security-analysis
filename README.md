# Link4M Bypass Script - Security Research & Deobfuscation Analysis

> **Disclaimer & Educational Purpose:**  
> Tài liệu và mã nguồn trong repository này chỉ phục vụ mục đích **nghiên cứu an ninh mạng, phân tích kỹ thuật làm rối mã nguồn (JavaScript Obfuscation & Deobfuscation), và đánh giá rủi ro an toàn thông tin (Security Audit)** trong môi trường khép kín. Không sử dụng cho bất kỳ hành vi vi phạm điều khoản dịch vụ hoặc phá hoại hệ thống.

---

## 📌 1. Tổng Quan Kỹ Thuật (Executive Summary)

* **Đối tượng nghiên cứu:** `link4m.user.js` & `link4m.js` (Phiên bản 4.4.0 từ VNBP).
* **Kỹ thuật làm rối:** JavaScript-Obfuscator (High Obfuscation Profile).
  * **String Array Encryption:** Mã hóa RC4 chuỗi văn bản + Base64 với bảng chuỗi tĩnh 742 KB (`_0x516d`).
  * **Proxy Wrapper Chain:** 2.742 hàm bọc trung gian nhiều tầng (độ sâu tới 6 cấp).
  * **Anti-Tampering / Anti-Format:** Chèn regex phát hiện beautify để kích hoạt vòng lặp treo máy nếu can thiệp thô sơ.
  * **Control Flow Flattening:** Băm nhỏ luồng rẽ nhánh bằng các vòng lặp `while(!![])` và khối `switch-case`.

---

## 🛠️ 2. Quy Trình Giải Mã AST (Deobfuscation Pipeline)

Chúng tôi đã xây dựng quy trình giải mã bằng `@babel/parser`, `@babel/traverse`, `@babel/generator` và Node.js VM:

1. **Vô hiệu hóa Anti-Tampering & Khởi tạo VM Context:** Tách hàm giải mã RC4 gốc (`_0x520c`) và mảng đã xoay vòng vào môi trường ảo khép kín.
2. **Xây dựng Cây Suy Diễn Proxy Functions:** Lập bản đồ đệ quy 2.742 hàm đệm về hàm gốc `_0x520c(index, key)`.
3. **Thế Chỗ Tự Động (Literal Replacement):** Giải mã và thay thế toàn bộ **20.782 lệnh gọi hàm mã hóa** thành chuỗi văn bản rõ ràng (`StringLiteral`).
4. **Gộp Chuỗi & Chuẩn Hóa AST (Constant Folding):**
   * Ghép nối hơn 5.000 phép nối chuỗi con (`"a" + "b"` -> `"ab"`).
   * Chuẩn hóa 10.391 thuộc tính truy cập từ dạng `obj["property"]` sang dạng `obj.property`.

---

## 🔍 3. Kết Quả Phân Tích & Kiểm Tra An Ninh (Security Audit)

* **Mã độc & Đánh cắp dữ liệu:** **HOÀN TOÀN KHÔNG CÓ.**
  * Không phát hiện Webhook Discord lén gửi thông tin.
  * Không đánh cắp Cookies, LocalStorage hay Discord Token của người dùng.
* **Cơ chế vượt Rate-Limit:**
  * Nhúng sẵn một pool gồm **100 API Key miễn phí** của dịch vụ `api.ocr.space` (`K89892142388957`, `K85759966688957`...) để chia tải nhận diện chữ trong ảnh nhiệm vụ.
* **Quy trình hoạt động cốt lõi (4 Bước):**
  1. **Bước 1 (OCR):** Quét ảnh nhiệm vụ trên Link4M, gửi lên OCR.space lấy domain nhà quảng cáo đích.
  2. **Bước 2 (Scrape Widget):** Tải HTML trang đích, trích xuất `traffic_domain`, `traffic_key`, `session`, `traffic_wait_time`.
  3. **Bước 3 (Fingerprint & Token):** Giả lập thông số trình duyệt (`client_id`, `os`, `browserMajorVersion`) gửi tới `https://{trafficDomain}/widget/client.js`, sandbox hàm `eval()` để lấy token `window.jscd.request`.
  4. **Bước 4 (Fetch Code):** Gửi yêu cầu tới `get_quest_code.html`, đếm ngược thời gian lưu trang giả lập, nhận mã code cuối cùng và tự động điền vào form.

---

## 📂 4. Cấu Trúc Repository

| Tệp tin | Mô tả |
|---|---|
| `link4m_deobfuscated.js` | Toàn bộ mã nguồn đã giải mã sạch đẹp (1.18 MB) |
| `deobfuscator_ast.js` | Script Babel AST tự động giải mã chuỗi RC4 |
| `extract_secrets.py` | Script Python trích xuất endpoint, API keys và tokens |
| `README.md` | Báo cáo chi tiết kỹ thuật bảo mật |
