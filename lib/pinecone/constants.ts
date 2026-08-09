export const PINECONE_KB_EMBED_MODEL = "multilingual-e5-large";

export const PINECONE_KB_EMBED_FIELD = "chunk_text";

/** Pinecone metadata limit is 40960 bytes per vector (includes the embed text field). */
export const PINECONE_KB_MAX_CHUNK_TEXT_BYTES = 38_000;

export const PINECONE_KB_DEFAULT_CLOUD = "aws";

/** Nearest Pinecone serverless region to Vietnam (AWS Singapore). */
export const PINECONE_KB_DEFAULT_REGION = "us-east-1";
