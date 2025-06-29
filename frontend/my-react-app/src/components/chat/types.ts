export interface Message {
  role: "user" | "assistant"
  content: string
}

export interface Conversation {
  conversation_id: string
  title: string
  created_at: string
  updated_at: string
}

export interface Recipe {
  recipe_id: string
  title: string
  content: {
    text: string
  }
  created_at: string
  updated_at: string
}

export interface NotificationItem {
  id: string
  message: string
  type: "success" | "error" | "info"
}
