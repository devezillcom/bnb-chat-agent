# Website Embed API

API công khai để gắn chat agent vào một website. Client tự giữ `visitorId`, đổi public key lấy token, rồi gửi tin và đọc câu trả lời theo stream.

Đoạn mã trong dashboard chỉ nhúng script `/embed/chat.js`. Tài liệu này là cho client tự gọi HTTP API.

Base URL là origin của app, ví dụ `https://chat.example.com`.

## Chuẩn bị

Trong dashboard, tạo một **Website chat** và gán một agent. Mỗi kênh có:

| Giá trị | Dùng để |
| --- | --- |
| Public key | Trường `data-public-key` trong mã nhúng. Không phải bí mật. Dài 16–128 ký tự. |
| Allowed origin | Origin duy nhất được phép bootstrap, dạng `https://host` hoặc `https://host:port`. Lấy từ URL website đã lưu, không gồm path. |

Bootstrap so khớp `Origin` với allowed origin theo chuỗi chính xác. `https://shop.example` và `https://www.shop.example` là hai origin khác nhau.

Kênh chưa gán agent thì bootstrap trả `409`. Session và gửi tin cũng bị từ chối cho đến khi có agent.

## Luồng gọi

1. Tạo `visitorId` (UUID) và lưu trên trình duyệt của khách, ví dụ `localStorage`. Cùng một id thì cùng một hội thoại.
2. `POST /api/embed/bootstrap` với public key và header `Origin`. Nhận `token` (hiệu lực 12 giờ).
3. `GET /api/embed/session` để lấy tên agent, câu chào, và lịch sử nếu khách đã chat.
4. `POST /api/embed/messages` để gửi một lượt. Đọc stream NDJSON cho đến event `done`.
5. Khi gặp `ERR_EMBED_TOKEN_EXPIRED`, gọi lại bootstrap rồi thử lại request vừa fail.

```text
visitorId (UUID, giữ lại)
        │
        ▼
POST /api/embed/bootstrap ──► token, expiresAt
        │
        ▼
GET  /api/embed/session    ──► agentName, firstMessage, messages
        │
        ▼
POST /api/embed/messages   ──► NDJSON: session → token* → done
```

## CORS

Chỉ `POST /api/embed/bootstrap` và `OPTIONS /api/embed/bootstrap` trả header CORS. Trình duyệt trên site khách có thể gọi bootstrap trực tiếp.

`GET /api/embed/session` và `POST /api/embed/messages` không gửi `Access-Control-Allow-Origin`. Gọi hai endpoint này từ:

- cùng origin với app (iframe hoặc script được host trên app), hoặc
- server của bạn, rồi tự stream câu trả lời về trình duyệt.

Server tự gọi bootstrap thì phải gửi header `Origin` đúng allowed origin. Thiếu header này, API trả 404.

## `POST /api/embed/bootstrap`

Đổi public key lấy token phiên.

```http
POST /api/embed/bootstrap
Origin: https://shop.example
Content-Type: application/json

{ "publicKey": "your-public-key" }
```

`200`:

```json
{
  "token": "opaque-token",
  "expiresAt": "2026-09-28T05:00:00.000Z"
}
```

`token` là chuỗi opaque. Gửi nguyên văn, không tách hay sửa. `expiresAt` là thời điểm hết hạn, ISO 8601, 12 giờ sau lúc cấp.

Preflight:

```http
OPTIONS /api/embed/bootstrap
Origin: https://shop.example
```

`204`, với:

| Header | Giá trị |
| --- | --- |
| `Access-Control-Allow-Origin` | Đúng origin của request |
| `Access-Control-Allow-Methods` | `POST, OPTIONS` |
| `Access-Control-Allow-Headers` | `Content-Type` |
| `Access-Control-Max-Age` | `600` |

## `GET /api/embed/session`

Đọc cấu hình hiển thị và lịch sử của một khách.

```http
GET /api/embed/session?visitorId=6f1c2a30-7b4e-4d1a-9c3e-2a8b6d0e1f44
Authorization: Bearer <token>
```

`visitorId` là query tùy chọn, phải là UUID. Bỏ qua thì không có lịch sử.

`200`:

```json
{
  "agentName": "Lễ tân",
  "firstMessage": "Xin chào, tôi có thể giúp gì?",
  "sessionId": "0d5b9c2e-1f4a-4c8b-9a77-6e2d0c8b11aa",
  "messages": [
    { "role": "user", "content": "Còn phòng cuối tuần không?" },
    { "role": "assistant", "content": "Cuối tuần này còn phòng deluxe." }
  ]
}
```

| Trường | Ý nghĩa |
| --- | --- |
| `agentName` | Tên agent đang trả lời. |
| `firstMessage` | Câu chào để hiện trước tin đầu tiên. `null` nếu agent không đặt câu chào. API không tự gửi câu này vào hội thoại. |
| `sessionId` | Id hội thoại hiện tại, hoặc `null` nếu khách chưa chat. |
| `messages` | Lịch sử đã lưu. `role` là `user` hoặc `assistant`. `images` có thể có trên tin của khách (`{ "url": "..." }`). Embed API không nhận ảnh khi gửi tin mới. |

`sessionId` là `null` và `messages` rỗng khi chưa có hội thoại, hoặc khi kênh đã được gán sang agent khác. Tin tiếp theo sẽ mở hội thoại mới.

## `POST /api/embed/messages`

Gửi một tin của khách và nhận câu trả lời theo stream.

```http
POST /api/embed/messages
Content-Type: application/json

{
  "token": "<token>",
  "visitorId": "6f1c2a30-7b4e-4d1a-9c3e-2a8b6d0e1f44",
  "message": "Còn phòng cuối tuần không?"
}
```

Token nằm trong body, không dùng header `Authorization`. `visitorId` bắt buộc và phải là UUID. `message` sau khi trim dài từ 1 đến 4000 ký tự.

Thành công trả `200` với `Content-Type: application/x-ndjson; charset=utf-8`. Mỗi dòng là một JSON object. Đọc đến khi stream đóng.

| `type` | Khi nào | Trường |
| --- | --- | --- |
| `session` | Ngay khi đã có hội thoại | `sessionId` |
| `token` | Từng mảnh câu trả lời | `content` |
| `done` | Hết câu trả lời | `sessionId`, `message` (toàn bộ câu, đã trim) |
| `error` | Lỗi sau khi stream đã mở | `message` |

```json
{"type":"session","sessionId":"0d5b9c2e-1f4a-4c8b-9a77-6e2d0c8b11aa"}
{"type":"token","content":"Cuối tuần"}
{"type":"token","content":" này còn phòng deluxe."}
{"type":"done","sessionId":"0d5b9c2e-1f4a-4c8b-9a77-6e2d0c8b11aa","message":"Cuối tuần này còn phòng deluxe."}
```

Ghép mọi `content` theo thứ tự để hiện chữ dần. `done.message` là bản hoàn chỉnh. Nếu agent không tạo được chữ, `done.message` là `I am not sure how to answer that yet.`

Lỗi kiểm tra input, token, hoặc rate limit trả JSON thường (mục mã lỗi) trước khi stream mở. Lỗi trong lúc agent đang trả lời nằm trong một dòng `error`, và HTTP status vẫn là `200`.

Cùng `visitorId` trên cùng kênh thì các lượt sau nối tiếp hội thoại đó. Đổi agent của kênh thì lượt gửi tiếp theo xóa hội thoại cũ và tạo hội thoại mới.

## Giới hạn

Khi rate limit đang bật, cửa sổ là 60 giây:

| Việc | Giới hạn |
| --- | --- |
| Bootstrap theo IP (`X-Forwarded-For`, hop đầu) | 60 request |
| Bootstrap theo từng website chat | 60 request |
| Gửi tin theo từng cặp kênh + `visitorId` | 20 request |

Vượt giới hạn trả `429` / `ERR_EMBED_RATE_LIMIT`.

## Mã lỗi

Body lỗi:

```json
{ "error": "ERR_EMBED_TOKEN_EXPIRED", "message": "Chat session expired. Reload the page." }
```

`message` là câu tiếng Anh để hiện hoặc log. Định tuyến theo `error`.

| HTTP | `error` | Khi nào |
| --- | --- | --- |
| 400 | `ERR_INVALID_INPUT` | JSON sai, public key không hợp lệ, `visitorId` không phải UUID, hoặc tin rỗng / dài hơn 4000 ký tự. |
| 401 | `ERR_EMBED_TOKEN_INVALID` | Thiếu token, token sai chữ ký, hoặc token không đúng dạng. |
| 401 | `ERR_EMBED_TOKEN_EXPIRED` | Token quá 12 giờ. Bootstrap lại. |
| 404 | `ERR_EMBED_NOT_FOUND` | Không có `Origin`, public key không tồn tại, origin không khớp, hoặc kênh không còn. Với origin không hợp lệ, response bootstrap không kèm CORS. |
| 409 | `ERR_EMBED_AGENT_REQUIRED` | Kênh chưa có agent. |
| 429 | `ERR_EMBED_RATE_LIMIT` | Quá số request trong 60 giây. |
| 500 | `ERR_INTERNAL` | Lỗi máy chủ. |

## Ví dụ

Bootstrap từ trình duyệt của site khách:

```js
const baseUrl = "https://chat.example.com";
const visitorKey = "bnb-chat-visitor";

function visitorId() {
  const existing = localStorage.getItem(visitorKey);
  if (existing) return existing;
  const created = crypto.randomUUID();
  localStorage.setItem(visitorKey, created);
  return created;
}

async function bootstrap(publicKey) {
  const response = await fetch(`${baseUrl}/api/embed/bootstrap`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ publicKey }),
  });
  if (!response.ok) throw await response.json();
  return response.json();
}
```

Đọc phiên và gửi tin từ server, hoặc từ một trang cùng origin với app:

```js
async function loadSession(token, visitorId) {
  const url = new URL("/api/embed/session", baseUrl);
  url.searchParams.set("visitorId", visitorId);
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw await response.json();
  return response.json();
}

async function sendMessage(token, visitorId, message, onToken) {
  const response = await fetch(`${baseUrl}/api/embed/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, visitorId, message }),
  });

  if (!response.ok) throw await response.json();

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.trim()) continue;
      const event = JSON.parse(line);
      if (event.type === "token") onToken(event.content);
      if (event.type === "error") throw new Error(event.message);
      if (event.type === "done") return event;
    }
  }
}
```
