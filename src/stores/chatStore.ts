import { create } from 'zustand'

interface Message {
  id: string | number
  text: string
  sender: 'user' | 'bot'
  timestamp: Date
}

interface ChatState {
  messages: Message[]
  sessionId: string
  isLoading: boolean
  
  setMessages: (messages: Message[]) => void
  addMessage: (message: Message) => void
  prependMessages: (messages: Message[]) => void
  setSessionId: (id: string) => void
  setIsLoading: (loading: boolean) => void
  clearMessages: () => void
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  sessionId: '',
  isLoading: false,
  
  setMessages: (messages) => set({ messages }),
  addMessage: (message) => set((state) => ({ 
    messages: [...state.messages, message] 
  })),
  prependMessages: (newMessages) => set((state) => ({ 
    messages: [...newMessages, ...state.messages] 
  })),
  setSessionId: (id) => set({ sessionId: id }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  clearMessages: () => set({ messages: [] }),
}))
