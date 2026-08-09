import type { KnowledgeBaseDetectedLanguage } from "../constants";

const VIETNAMESE_DIACRITICS =
  /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/gi;

const VIETNAMESE_WORDS =
  /\b(và|hoặc|của|cho|với|theo|điều|khoản|mục|hợp|đồng|quy|định|thông|tư|nghị|căn|cứ|trong|này|được|không|phải|các|như|khi|nếu|tại|về|từ|đến|sau|trước|bên|phía|liên|quan|ngân|hàng|câu|hỏi|đáp|án|trả|lời|phụ|lục|chương|phần|cơ|sở|nội|dung|văn|bản|quy|chế|hướng|dẫn|thực|hiện|ban|hành|số|stt|danh|sách|mẫu|biểu|tổng|hợp|kiểm|tra|xác|minh|yêu|cầu|thông|tin|liên|hệ|địa|chỉ|điện|thoại|email|fax|website|tên|đơn|vị|chức|danh|ký|tên|ngày|tháng|năm|lưu|ý|ghi|chú)\b/gi;

const VIETNAMESE_WORDS_ASCII =
  /\b(va|hoac|cua|cho|voi|theo|dieu|khoan|muc|hop|dong|quy|dinh|thong|tu|nghi|can|cu|trong|nay|duoc|khong|phai|cac|nhu|khi|neu|tai|ve|tu|den|sau|truoc|ben|phia|lien|quan|ngan|hang|cau|hoi|dap|an|tra|loi|phu|luc|chuong|phan|co|so|noi|dung|van|ban|quy|che|huong|dan|thuc|hien|ban|hanh|danh|sach|mau|bieu|tong|hop|kiem|tra|xac|minh|yeu|cau|thong|tin|don|vi|chuc|danh|ky|ten|ngay|thang|nam|luu|y|ghi|chu)\b/gi;

const VIETNAMESE_STRUCTURE =
  /\b(cau hoi|dap an|tra loi|phu luc|can cu|quy dinh|thong tu|nghi dinh|hop dong|ngan hang)\b|\b(?:điều|dieu)\s+\d+\b|\b(?:khoản|khoan)\s+\d+\b|\b(?:mục|muc)\s+\d+\b/gi;

const ENGLISH_STOP_WORDS =
  /\b(the|and|or|is|are|was|were|have|has|had|this|that|with|from|for|not|but|can|will|would|should|could|been|being|into|about|which|when|where|what|how|who|whom|their|there|these|those|such|than|then|also|each|other|some|any|all|both|between|after|before|over|under|through|during|without|within|against|among|while|because|since|until|although|though|however|therefore|whether|shall|may|might|must|need|used|using|use|based|include|including|includes|provided|provide|pursuant|herein|hereby|hereof|thereof|whereas|wherein|notwithstanding)\b/gi;

const VIETNAMESE_FILENAME_HINT =
  /(?:ngân|ngan|hàng|hang|câu|cau|hỏi|hoi|đáp|dap|án|an|điều|dieu|khoản|khoan|mục|muc|hợp|hop|đồng|dong|quy|định|dinh|thông|thong|tư|tu|nghị|nghi|cơ|co|sở|so|phụ|phu|lục|luc|văn|van|bản|ban|quy|chế|che|biểu|bieu|mẫu|mau|tổng|tong|hợp|hop)/i;

function stripDiacritics(text: string): string {
  return text.normalize("NFD").replace(/\p{M}/gu, "");
}

function countMatches(text: string, pattern: RegExp): number {
  return (text.match(pattern) ?? []).length;
}

function scoreFromFilename(filename: string | undefined): number {
  if (!filename?.trim()) {
    return 0;
  }

  const normalized = stripDiacritics(filename).toLowerCase();
  let score = 0;

  if (VIETNAMESE_DIACRITICS.test(filename)) {
    score += 6;
  }

  if (VIETNAMESE_FILENAME_HINT.test(filename)) {
    score += 4;
  }

  if (/(?:^|[\s_-])(?:vi|vn|viet(?:namese)?)(?:[\s_.-]|$)/i.test(normalized)) {
    score += 3;
  }

  return score;
}

export function detectDocumentLanguage(
  markdown: string,
  filename?: string,
): KnowledgeBaseDetectedLanguage {
  const sample = markdown.slice(0, 12_000);
  if (!sample.trim()) {
    return filename && scoreFromFilename(filename) >= 4 ? "vi" : "unknown";
  }

  const normalizedSample = stripDiacritics(sample).toLowerCase();

  const viDiacritics = countMatches(sample, VIETNAMESE_DIACRITICS);
  const viWords =
    countMatches(sample, VIETNAMESE_WORDS) +
    countMatches(normalizedSample, VIETNAMESE_WORDS_ASCII);
  const viStructure = countMatches(normalizedSample, VIETNAMESE_STRUCTURE);
  const filenameScore = scoreFromFilename(filename);

  const viScore =
    viDiacritics * 2 + viWords * 4 + viStructure * 6 + filenameScore;

  const enWords = countMatches(sample.toLowerCase(), ENGLISH_STOP_WORDS);
  const enScore = enWords * 5;

  if (viScore >= 10 && enScore >= 10 && viScore >= enScore * 0.55 && enScore >= viScore * 0.55) {
    return "mixed";
  }

  if (viScore >= 8 && viScore >= enScore) {
    return "vi";
  }

  if (enScore >= 15 && enScore > viScore * 1.4) {
    return "en";
  }

  if (viScore >= 6) {
    return "vi";
  }

  if (enScore >= 10) {
    return "en";
  }

  if (filenameScore >= 4) {
    return "vi";
  }

  return "unknown";
}
