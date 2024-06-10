import { Injectable, Logger } from '@nestjs/common';
import { HttpClientService } from '../httpclient/httpclient.service';
import { ChatMessage } from './api/ChatMessage';

const DEFAULT_CHAT_API_MAX_TOKENS = 1000;

interface ChatRequest {
  readonly model: string;
  readonly messages: ChatMessage[];
  readonly stream: boolean;
  readonly max_tokens?: number;
  readonly temperature?: number;
}

interface ChatResponse {
  readonly choices: {
    readonly message: ChatMessage;
  }[];
}

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(private readonly httpClient: HttpClientService) {}

  async query(messages: ChatMessage[]): Promise<string> {
    this.logger.debug(`Chat query: ${JSON.stringify(messages)}`);

    if (
      !process.env.CHAT_API_URL ||
      !process.env.CHAT_API_MODEL ||
      !process.env.CHAT_API_TOKEN
    ) {
      throw new Error(
        'Chat API environment variables are missing. CHAT_API_URL, CHAT_API_MODEL, CHAT_API_TOKEN are mandatory.',
      );
    }

    const chatRequest: ChatRequest = {
      model: process.env.CHAT_API_MODEL,
      messages,
      max_tokens:
        +process.env.CHAT_API_MAX_TOKENS || DEFAULT_CHAT_API_MAX_TOKENS,
      stream: false,
    };

    const res = await this.httpClient.post<ChatResponse>(
      process.env.CHAT_API_URL,
      chatRequest,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.CHAT_API_TOKEN}`,
        },
      },
    );

    return res?.choices?.[0]?.message?.content;
  }
}
