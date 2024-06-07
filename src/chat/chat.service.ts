import { Injectable, Logger } from '@nestjs/common';
import { HttpClientService } from '../httpclient/httpclient.service';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(private readonly httpClient: HttpClientService) {}

  async ask(question: string): Promise<string> {
    this.logger.log(`Answering question: ${question}`);

    if (
      !process.env.CHAT_API_URL ||
      !process.env.CHAT_API_MODEL ||
      !process.env.CHAT_API_TOKEN
    ) {
      throw new Error(
        'Chat API environment variables are missing. CHAT_API_URL, CHAT_API_MODEL, CHAT_API_TOKEN are mandatory.',
      );
    }

    const res = await this.httpClient.post(
      process.env.CHAT_API_URL,
      {
        model: process.env.CHAT_API_MODEL,
        messages: [
          {
            role: 'user',
            content: question,
          },
        ],
        max_tokens: +process.env.CHAT_API_MAX_TOKENS || 1000,
        stream: false,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.CHAT_API_TOKEN}`,
        },
      },
    );

    return (res as any)?.choices?.[0]?.message?.content;
  }
}
