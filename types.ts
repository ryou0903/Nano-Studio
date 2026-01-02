export enum AppMode {
  GENERATE = 'GENERATE',
  GALLERY = 'GALLERY',
  CHAT = 'CHAT',
}

// --- Image Generation Types ---
export interface GeneratedImage {
  id: string;
  base64: string;
  prompt: string;
  timestamp: number;
  width: number;
  height: number;
  model: string;
}

export interface PendingImage {
  id: string;
  timestamp: number;
  progress: number; // 0 to 100
}

export enum ModelType {
  PRO = 'gemini-3-pro-image-preview', // Nano Banana Pro
  FLASH = 'gemini-2.5-flash-image',   // Nano Banana (Backup)
}

export type AspectRatio = '1:1' | '3:4' | '4:3' | '9:16' | '16:9';
export type ImageSize = '1K' | '2K' | '4K'; // Only for Pro

export interface GenSettings {
  model: ModelType;
  aspectRatio: AspectRatio;
  imageSize: ImageSize;
  numberOfImages: number;
}

// --- Chat Types ---

export enum ChatModelType {
  GEMINI_3_PRO = 'gemini-3-pro-preview',
  GEMINI_3_FLASH = 'gemini-3-flash-preview',
}

export enum ThinkingBudget {
  OFF = 0,
  LOW = 2048,
  MEDIUM = 4096,
  HIGH = 8192,
  MAX_FLASH = 24576,
  MAX_PRO = 32768,
}

export interface SystemPrompt {
  id: string;
  name: string;
  content: string;
}

export interface KnowledgeFile {
  id: string;
  name: string;
  mimeType: string;
  data: string; // base64 string
}

export interface ChatSettings {
  model: ChatModelType;
  
  // System Prompt
  isSystemPromptEnabled: boolean;
  systemPromptId: string | null; // ID of selected system prompt
  
  // Knowledge
  knowledgeFiles: KnowledgeFile[];

  // Tools / Config
  useWebSearch: boolean;
  thinkingBudget: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  attachments?: string[]; // base64 images
  isThinking?: boolean; // If true, UI shows thinking state
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  updatedAt: number;
  isFavorite: boolean;
  settings: ChatSettings; // Settings used for this session
}