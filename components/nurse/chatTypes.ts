export type ChatRole = 'user' | 'nurse';

export interface ChatMessage {
  id: string;
  role: ChatRole;
  text: string;
  /** Nurse replies animate in with a typewriter reveal on first mount. */
  typewriter?: boolean;
}
