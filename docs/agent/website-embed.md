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
2. `POST /api/embed/bootstrap` với public key, `visitorId`, và header `Origin`. Nhận `token` (hiệu lực 12 giờ) và thông tin stream RTDB.
3. Mở `EventSource` tới `rtdb.streamUrl` để nghe tin assistant cuối trên mọi trình duyệt của cùng `visitorId`.
4. `GET /api/embed/session` để lấy tên agent, câu chào, và lịch sử nếu khách đã chat.
5. `POST /api/embed/messages` để gửi một lượt. Đọc stream NDJSON cho đến event `done`.
6. Khi gặp `ERR_EMBED_TOKEN_EXPIRED`, hoặc stream RTDB báo `auth_revoked`, gọi lại bootstrap rồi thử lại.

```text
visitorId (UUID, giữ lại)
        │
        ▼
POST /api/embed/bootstrap ──► token, expiresAt, rtdb
        │
        ├─ EventSource(rtdb.streamUrl?auth=) ──► tin assistant cuối
        ▼
GET  /api/embed/session    ──► agentName, firstMessage, messages
        │
        ▼
POST /api/embed/messages   ──► NDJSON: session → token* → done
```

## CORS

`bootstrap`, `session`, `messages`, và `images` phản chiếu header `Origin` của request vào `Access-Control-Allow-Origin`. Preflight `OPTIONS` cho phép `GET`, `POST`, và các header `Authorization`, `Content-Type`.

Widget trên origin khác, kể cả `http://localhost:5173`, gọi được các endpoint này từ trình duyệt. `PUT` file lên URL của R2 là request khác: bucket R2 phải cho phép `PUT` từ origin của site khách.

Server tự gọi bootstrap thì phải gửi header `Origin` đúng allowed origin. Thiếu header này, API trả 404.

## `POST /api/embed/bootstrap`

Đổi public key lấy token phiên.

```http
POST /api/embed/bootstrap
Origin: https://shop.example
Content-Type: application/json

{
  "publicKey": "your-public-key",
  "visitorId": "6f1c2a30-7b4e-4d1a-9c3e-2a8b6d0e1f44"
}
```

`visitorId` bắt buộc, là UUID do client tạo và giữ lại. Bootstrap dùng id này để cấp quyền đọc đúng một node RTDB.

`200`:

```json
{
  "token": "opaque-token",
  "expiresAt": "2026-09-28T17:00:00.000Z",
  "rtdb": {
    "streamUrl": "https://your-project-default-rtdb.firebaseio.com/embed-messages/connection-id/visitor-id.json",
    "authToken": "firebase-id-token",
    "expiresAt": "2026-09-28T06:00:00.000Z"
  }
}
```

`token` là chuỗi opaque. Gửi nguyên văn, không tách hay sửa. `expiresAt` ở ngoài là hạn của token phiên, ISO 8601, 12 giờ sau lúc cấp.

`rtdb` là `null` khi server chưa cấu hình Firebase. Khi có giá trị:

| Trường | Ý nghĩa |
| --- | --- |
| `streamUrl` | URL REST streaming của node tin assistant cuối. Chưa gồm `auth`. |
| `authToken` | Firebase ID token. Gắn vào query `auth` của `streamUrl`. |
| `expiresAt` | Hạn của `authToken`, thường 1 giờ. Hết hạn thì stream gửi `auth_revoked`. Bootstrap lại. |

Mở stream từ browser:

```js
const source = new EventSource(
  `${rtdb.streamUrl}?auth=${encodeURIComponent(rtdb.authToken)}`,
);

source.addEventListener("put", (event) => {
  const payload = JSON.parse(event.data);
  const record = payload.data;
  if (!record?.message) return;
  // record.message là câu assistant cuối. record.sessionId, record.updatedAt
});
```

Event `put` đầu tiên là dữ liệu hiện có tại node đó. Mỗi lần agent trả lời xong, server ghi đè cùng node, và stream nhận `put` mới với `path` là `"/"`. Không có từng mảnh chữ. Tab vừa gửi tin vẫn dùng NDJSON để hiện chữ dần. Tab khác chỉ nhận câu đã xong.

Rules RTDB phải cho phép khách đọc đúng node của mình, và không cho client ghi:

```json
{
  "rules": {
    "embed-messages": {
      "$connectionId": {
        "$visitorId": {
          ".read": "auth != null && auth.uid == $visitorId && auth.token.connectionId == $connectionId",
          ".write": false
        }
      }
    }
  }
}
```

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
| `messages` | Lịch sử đã lưu. `role` là `user` hoặc `assistant`. Tin của khách có thể có `images`: `{ "url", "key", "mimeType", "fileName" }`. |

`sessionId` là `null` và `messages` rỗng khi chưa có hội thoại, hoặc khi kênh đã được gán sang agent khác. Tin tiếp theo sẽ mở hội thoại mới.

## `POST /api/embed/messages`

Gửi một tin của khách và nhận câu trả lời theo stream.

```http
POST /api/embed/messages
Content-Type: application/json

{
  "token": "<token>",
  "visitorId": "6f1c2a30-7b4e-4d1a-9c3e-2a8b6d0e1f44",
  "message": "Còn phòng cuối tuần không?",
  "images": [
    {
      "url": "https://cdn.example/workspaces/workspace-id/chat-agent-images/file.jpg",
      "key": "workspaces/workspace-id/chat-agent-images/file.jpg",
      "mimeType": "image/jpeg",
      "fileName": "room.jpg"
    }
  ]
}
```

Token nằm trong body, không dùng header `Authorization`. `visitorId` bắt buộc và phải là UUID. `message` sau khi trim dài tối đa 4000 ký tự. `images` tùy chọn, tối đa 5 ảnh. Tin phải có chữ hoặc ít nhất một ảnh. `url` và `key` phải là file vừa upload qua `/api/embed/images` của đúng workspace. URL bên ngoài bị từ chối.

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

## `POST /api/embed/images`

Xin URL để widget tải ảnh thẳng lên kho file. Gọi một lần cho mỗi ảnh, trước khi gửi tin.

```http
POST /api/embed/images
Content-Type: application/json

{
  "token": "<token>",
  "visitorId": "6f1c2a30-7b4e-4d1a-9c3e-2a8b6d0e1f44",
  "contentType": "image/jpeg",
  "contentLength": 245760
}
```

Loại được phép: JPEG, PNG, WebP, GIF. Tối đa 15 MB.

`200`:

```json
{
  "uploadUrl": "https://signed-upload.example/...",
  "key": "workspaces/workspace-id/chat-agent-images/file.jpg",
  "publicUrl": "https://cdn.example/workspaces/workspace-id/chat-agent-images/file.jpg",
  "expiresAt": 1780000000000
}
```

`PUT` nội dung file lên `uploadUrl` với header `Content-Type` đúng loại file. `expiresAt` là thời điểm URL ký hết hạn, tính bằng mili giây. Sau khi `PUT` thành công, gửi `publicUrl` và `key` trong `images` của `/api/embed/messages`.

## Giới hạn

Khi rate limit đang bật, cửa sổ là 60 giây:

| Việc | Giới hạn |
| --- | --- |
| Bootstrap theo IP (`X-Forwarded-For`, hop đầu) | 60 request |
| Bootstrap theo từng website chat | 60 request |
| Gửi tin theo từng cặp kênh + `visitorId` | 20 request |
| Xin URL upload ảnh theo từng cặp kênh + `visitorId` | 30 request |

Vượt giới hạn trả `429` / `ERR_EMBED_RATE_LIMIT`.

## Mã lỗi

Body lỗi:

```json
{ "error": "ERR_EMBED_TOKEN_EXPIRED", "message": "Chat session expired. Reload the page." }
```

`message` là câu tiếng Anh để hiện hoặc log. Định tuyến theo `error`.

| HTTP | `error` | Khi nào |
| --- | --- | --- |
| 400 | `ERR_INVALID_INPUT` | JSON sai, public key không hợp lệ, `visitorId` không phải UUID, tin không có chữ lẫn ảnh, hoặc tin dài hơn 4000 ký tự. |
| 400 | `ERR_EMBED_IMAGE_INVALID` | Ảnh không thuộc kho của workspace này. |
| 400 | `ERR_UPLOAD_MIME` | Không phải JPEG, PNG, WebP, hoặc GIF. |
| 400 | `ERR_UPLOAD_SIZE` | Ảnh lớn hơn 15 MB. |
| 401 | `ERR_EMBED_TOKEN_INVALID` | Thiếu token, token sai chữ ký, hoặc token không đúng dạng. |
| 401 | `ERR_EMBED_TOKEN_EXPIRED` | Token quá 12 giờ. Bootstrap lại. |
| 404 | `ERR_EMBED_NOT_FOUND` | Không có `Origin`, public key không tồn tại, origin không khớp, hoặc kênh không còn. Với origin không hợp lệ, response bootstrap không kèm CORS. |
| 409 | `ERR_EMBED_AGENT_REQUIRED` | Kênh chưa có agent. |
| 429 | `ERR_EMBED_RATE_LIMIT` | Quá số request trong 60 giây. |
| 500 | `ERR_INTERNAL` | Lỗi máy chủ. |
| 503 | `ERR_EMBED_RTDB_UNAVAILABLE` | Firebase đã cấu hình nhưng không cấp được token stream. |
| 503 | `ERR_NOT_CONFIGURED` | Kho file chưa được cấu hình. |

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
    body: JSON.stringify({ publicKey, visitorId: visitorId() }),
  });
  if (!response.ok) throw await response.json();
  return response.json();
}
```

Đọc phiên và gửi tin:

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
