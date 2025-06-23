export interface Message {
  role: string;
  content: string;
}

export interface Conversation {
  conversation_id: string;
  title?: string;
}

export interface Recipe {
  recipe_id: string;
  title: string;
  content: string;
}