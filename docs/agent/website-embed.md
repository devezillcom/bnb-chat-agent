# Website Embed API

API công khai để gắn chat agent vào một website. Client tự giữ `visitorId`, đổi public key lấy token, rồi gửi tin và đọc câu trả lời theo stream.

Đoạn mã trong dashboard chỉ nhúng script `/embed/chat.js`. Tài liệu này là cho client tự gọi HTTP API.

Base URL là origin của app, ví dụ `https://chat.example.com`.

## Chuẩn bị

Trong dashboard, tạo một **Website chat** và gán một agent. Mỗi kênh có:

| Giá trị | Dùng để |
| --- | --- |
| Public key | Trường `data-public-key` trong mã nhúng. Không phải bí mật. Dài 16–128 ký tự. |
| Allowed origins | Danh sách origin được phép bootstrap, hoặc mọi website. Mỗi origin dạng `https://host` hoặc `http://host:port`. Domain không kèm giao thức được lưu thành `https://`. Path không được giữ. |

Khi kênh bật cho phép mọi website, mọi header `Origin` dùng `http` hoặc `https` đều bootstrap được. Khi kênh liệt kê domain, bootstrap so khớp `Origin` với từng origin đã lưu. `https://shop.example` và `https://www.shop.example` là hai origin khác nhau.

Kênh cũ chỉ lưu một `allowed_origin` vẫn được đọc như danh sách một origin, cho đến khi lưu lại cấu hình.

Kênh chưa gán agent thì bootstrap trả `409`. Session và gửi tin cũng bị từ chối cho đến khi có agent.

## Luồng gọi

1. Tạo `visitorId` (UUID) và lưu trên trình duyệt của khách, ví dụ `localStorage`. Cùng một id thì cùng một hội thoại.
2. `POST /api/embed/bootstrap` với public key và header `Origin`. Nhận `token` (hiệu lực 12 giờ), ảnh đại diện, và câu gợi ý mở đầu.
3. `GET /api/embed/session` để lấy tên agent, câu chào, lịch sử nếu khách đã chat, và stream notification của hội thoại.
4. Mở `EventSource` tới `notification.streamUrl` để nghe tin assistant cuối. Mỗi lượt chat xong, và mỗi tin assistant do job nền ghi sau đó, đều ghi đè cùng kênh này.
5. `POST /api/embed/messages` để gửi một lượt. Tab vừa gửi tin đọc stream NDJSON cho đến event `done`.
6. Khi event `session` mang một `sessionId` mới, gọi lại `GET /api/embed/session` để lấy `notification`, rồi mở EventSource kênh đó.
7. `POST /api/embed/messages/clear` để xóa lịch sử của khách này. `sessionId` giữ nguyên. Xóa tin đang hiện trên widget. Giữ EventSource.
8. Khi gặp `ERR_EMBED_TOKEN_EXPIRED`, gọi lại bootstrap. Stream notification hết hạn hoặc báo `auth_revoked` thì gọi lại `GET /api/embed/session`.

```text
visitorId (UUID, giữ lại)
        │
        ▼
POST /api/embed/bootstrap ──► token, expiresAt, avatarUrl, conversationStarters
        │
        ▼
GET  /api/embed/session    ──► agentName, firstMessage, messages, notification
        │
        ├─ EventSource(notification.streamUrl?auth=) ──► tin assistant cuối
        ▼
POST /api/embed/messages   ──► NDJSON: session → token* → done
POST /api/embed/messages/clear ──► { cleared: true, sessionId }
```

## CORS

`bootstrap`, `session`, `messages`, `messages/clear`, và `images` phản chiếu header `Origin` của request vào `Access-Control-Allow-Origin`. Preflight `OPTIONS` cho phép `GET`, `POST`, và các header `Authorization`, `Content-Type`.

Widget trên origin khác, kể cả `http://localhost:5173`, gọi được các endpoint này từ trình duyệt. `PUT` file lên URL của R2 là request khác: bucket R2 phải cho phép `PUT` từ origin của site khách.

Server tự gọi bootstrap thì phải gửi header `Origin`. Thiếu header này, API trả 404. Origin phải nằm trong danh sách đã lưu, trừ khi kênh cho phép mọi website.

## `POST /api/embed/bootstrap`

Đổi public key lấy token phiên.

```http
POST /api/embed/bootstrap
Origin: https://shop.example
Content-Type: application/json

{
  "publicKey": "your-public-key"
}
```

`200`:

```json
{
  "token": "opaque-token",
  "expiresAt": "2026-09-28T17:00:00.000Z",
  "avatarUrl": "https://cdn.example.com/workspaces/workspace-id/agent-avatars/image.webp",
  "conversationStarters": [
    "Còn phòng cuối tuần không?",
    "Giờ nhận phòng là mấy giờ?"
  ]
}
```

`token` là chuỗi opaque. Gửi nguyên văn, không tách hay sửa. `expiresAt` là hạn của token phiên, ISO 8601, 12 giờ sau lúc cấp. Bootstrap không cấp stream RTDB. Tin assistant cuối nằm ở `notification` của `GET /api/embed/session`.

| Trường | Ý nghĩa |
| --- | --- |
| `avatarUrl` | Ảnh đại diện của agent. `null` nếu agent chưa tải ảnh. Widget tự chọn ảnh thay thế khi giá trị là `null`. |
| `conversationStarters` | Các câu gợi ý khách có thể bấm để gửi tin mở đầu. Mảng rỗng nếu agent không đặt. API không tự đưa các câu này vào hội thoại. |

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
    {
      "role": "user",
      "content": "Còn phòng cuối tuần không?",
      "createdAt": "2026-09-29T04:12:00.000Z"
    },
    {
      "role": "assistant",
      "content": "Cuối tuần này còn phòng deluxe.",
      "createdAt": "2026-09-29T04:12:08.000Z"
    }
  ],
  "notification": {
    "streamUrl": "https://your-project-default-rtdb.firebaseio.com/channel-notifications/agent-session-0d5b9c2e-1f4a-4c8b-9a77-6e2d0c8b11aa.json",
    "authToken": "firebase-id-token",
    "expiresAt": "2026-09-28T06:00:00.000Z"
  }
}
```

| Trường | Ý nghĩa |
| --- | --- |
| `agentName` | Tên agent đang trả lời. |
| `firstMessage` | Câu chào để hiện trước tin đầu tiên. `null` nếu agent không đặt câu chào. API không tự gửi câu này vào hội thoại. |
| `sessionId` | Id hội thoại hiện tại, hoặc `null` nếu khách chưa chat. |
| `messages` | Lịch sử đã lưu. `role` là `user` hoặc `assistant`. `createdAt` là thời điểm gửi, ISO 8601, và có thể thiếu với tin cũ. Tin của khách có thể có `images`: `{ "url", "key", "mimeType", "fileName" }`. |
| `notification` | Stream RTDB của tin assistant cuối trên hội thoại này. `null` khi chưa có hội thoại, hoặc khi Firebase chưa được cấu hình. |

`sessionId` là `null`, `messages` rỗng, và `notification` là `null` khi chưa có hội thoại, hoặc khi kênh đã được gán sang agent khác. Tin tiếp theo sẽ mở hội thoại mới. Sau event NDJSON `session` của tin đó, gọi lại endpoint này để lấy `notification`.

`notification.streamUrl` trỏ tới `channel-notifications/agent-session-{sessionId}`. `authToken` là Firebase ID token có claim `sessionChannel` đúng tên kênh đó. Token phiên của bootstrap không đọc được kênh này.

| Trường | Ý nghĩa |
| --- | --- |
| `streamUrl` | URL REST streaming của kênh hội thoại. Chưa gồm `auth`. |
| `authToken` | Firebase ID token. Gắn vào query `auth` của `streamUrl`. |
| `expiresAt` | Hạn của `authToken`, thường 1 giờ. Hết hạn thì stream gửi `auth_revoked`. Gọi lại `GET /api/embed/session`. |

Mở stream notification:

```js
let appliedNotificationAt = 0;
let sawNotificationSnapshot = false;
const source = new EventSource(
  `${notification.streamUrl}?auth=${encodeURIComponent(notification.authToken)}`,
);

source.addEventListener("put", (event) => {
  const body = JSON.parse(event.data);
  if (body.path !== "/") return;

  const record = body.data;
  const updatedAt = typeof record?.updatedAt === "number" ? record.updatedAt : 0;
  if (!sawNotificationSnapshot) {
    sawNotificationSnapshot = true;
    appliedNotificationAt = updatedAt;
    return;
  }

  const payload = record?.payload;
  if (payload?.role !== "assistant" || !payload.message) return;
  if (updatedAt <= appliedNotificationAt) return;
  appliedNotificationAt = updatedAt;
  // Nối payload.message vào danh sách tin. Không tải lại lịch sử.
});
```

Event `put` đầu tiên là dữ liệu đang có. Bỏ qua, vì tin đó đã nằm trong `messages` nếu tab vừa tải hội thoại. Các `put` sau là tin assistant mới. `payload.event` là `assistant_message` khi một lượt chat vừa xong, hoặc `bienhinh_image_completed` / `bienhinh_image_failed` khi job nền ghi thêm một câu. Tab vừa gửi tin đã có câu đó từ NDJSON `done`, nên không nối lại cùng một `payload.message`. Tab khác nối `payload.message`. `updatedAt` chặn lần EventSource nối lại gửi lại cùng một bản ghi.

`notification.expiresAt` thường là 1 giờ. Hết hạn hoặc stream gửi `auth_revoked` thì gọi lại `GET /api/embed/session`, đóng EventSource cũ, mở stream mới, và lại bỏ snapshot đầu.

Rules RTDB cho phép đọc kênh hội thoại, và không cho client ghi:

```json
{
  "rules": {
    "channel-notifications": {
      "$channel": {
        ".read": "auth != null && (auth.token.sessionChannel == $channel || auth.token.firebase.sign_in_provider != 'custom')",
        ".write": false
      }
    },
    "jobs": {
      "$jobKey": {
        ".read": "auth != null",
        ".write": false
      }
    }
  }
}
```

`channel-notifications` là kênh theo từng hội thoại, path `agent-session-{sessionId}`. Dashboard đăng nhập email hoặc Google đọc được kênh này. Token custom của embed chỉ đọc đúng kênh ghi trong claim `sessionChannel`. Server ghi bằng Admin SDK. Giữ các path khác đang có trên console khi dán rule. Thay cả file rules bằng đúng khối này sẽ xóa path không có trong khối.

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

## `POST /api/embed/messages/clear`

Xóa lịch sử chat của một khách trên kênh này và giữ nguyên `sessionId`. Agent không còn nhớ các lượt trước. Khách chưa từng chat vẫn nhận `200`, với `sessionId` là `null`.

```http
POST /api/embed/messages/clear
Content-Type: application/json

{
  "token": "<token>",
  "visitorId": "6f1c2a30-7b4e-4d1a-9c3e-2a8b6d0e1f44"
}
```

Token nằm trong body. `visitorId` bắt buộc và phải là UUID.

`200`:

```json
{
  "cleared": true,
  "sessionId": "0d5b9c2e-1f4a-4c8b-9a77-6e2d0c8b11aa"
}
```

`sessionId` là hội thoại hiện tại. Sau khi xóa, `GET /api/embed/session` trả cùng `sessionId`, `messages` rỗng, và cùng `notification`. Giữ EventSource. Tin tiếp theo nối tiếp hội thoại này, với ngữ cảnh trống.

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
| Xóa lịch sử theo từng cặp kênh + `visitorId` | 20 request |
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
| 404 | `ERR_EMBED_NOT_FOUND` | Không có `Origin`, public key không tồn tại, origin không nằm trong danh sách (và kênh không cho phép mọi website), hoặc kênh không còn. Với origin không hợp lệ, response bootstrap không kèm CORS. |
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
    body: JSON.stringify({ publicKey }),
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

async function clearMessages(token, visitorId) {
  const response = await fetch(`${baseUrl}/api/embed/messages/clear`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, visitorId }),
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
