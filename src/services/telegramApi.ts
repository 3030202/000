// Zero-dependency Telegram Bot API client for 000-Mission-Control

export interface TelegramBotInfo {
  id: number;
  is_bot: boolean;
  first_name: string;
  username?: string;
  can_join_groups?: boolean;
  can_read_all_group_messages?: boolean;
  supports_inline_queries?: boolean;
}

export interface TelegramApiResponse<T = any> {
  ok: boolean;
  result?: T;
  error_code?: number;
  description?: string;
}

export const telegramApi = {
  /**
   * Test Telegram Bot token validity and fetch bot profile
   */
  async testBot(token: string): Promise<TelegramApiResponse<TelegramBotInfo>> {
    const cleanToken = token.trim();
    if (!cleanToken) {
      return { ok: false, description: 'Telegram Bot Token is empty' };
    }

    try {
      const res = await fetch(`https://api.telegram.org/bot${cleanToken}/getMe`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });
      const data = await res.json();
      return data;
    } catch (err: any) {
      return {
        ok: false,
        description: err?.message || 'Network error / CORS issue reaching api.telegram.org'
      };
    }
  },

  /**
   * Send a text message to a specific chat / channel / user
   */
  async sendMessage(
    token: string, 
    chatId: string, 
    text: string, 
    parseMode: 'Markdown' | 'HTML' | 'None' = 'Markdown'
  ): Promise<TelegramApiResponse> {
    const cleanToken = token.trim();
    const cleanChatId = chatId.trim();

    if (!cleanToken) {
      return { ok: false, description: 'Telegram Bot Token is empty' };
    }
    if (!cleanChatId) {
      return { ok: false, description: 'Telegram Chat ID is required' };
    }
    if (!text.trim()) {
      return { ok: false, description: 'Message body cannot be empty' };
    }

    try {
      const bodyPayload: Record<string, any> = {
        chat_id: cleanChatId,
        text: text
      };
      if (parseMode !== 'None') {
        bodyPayload.parse_mode = parseMode;
      }

      const res = await fetch(`https://api.telegram.org/bot${cleanToken}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(bodyPayload)
      });

      const data = await res.json();
      return data;
    } catch (err: any) {
      return {
        ok: false,
        description: err?.message || 'Network error dispatching Telegram message'
      };
    }
  },

  /**
   * Get latest updates / recent chats to discover Chat IDs
   */
  async getUpdates(token: string): Promise<TelegramApiResponse<any[]>> {
    const cleanToken = token.trim();
    if (!cleanToken) {
      return { ok: false, description: 'Telegram Bot Token is empty' };
    }

    try {
      const res = await fetch(`https://api.telegram.org/bot${cleanToken}/getUpdates?limit=5`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      const data = await res.json();
      return data;
    } catch (err: any) {
      return {
        ok: false,
        description: err?.message || 'Network error fetching Telegram updates'
      };
    }
  }
};
