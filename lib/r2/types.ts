export type GetUploadSignedUrlParams = {
  contentType: string;
  contentLength: number;
  maxBytes: number;
  allowedMimes: ReadonlySet<string>;
  mimeError: string;
  sizeError: string;
  prefix?: string;
  expiresInSec?: number;
};

export type GetUploadSignedUrlResult = {
  uploadUrl: string;
  key: string;
  publicUrl: string;
  expiresAt: number;
};
