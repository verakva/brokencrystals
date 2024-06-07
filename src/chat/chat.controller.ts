import {
  Body,
  Controller,
  HttpException,
  HttpStatus,
  Logger,
  Post,
} from '@nestjs/common';
import { ApiBody, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { API_DESC_CHAT_QUESTION } from './chat.controller.api.desc';
import { ChatQuestion } from './api/ChatQuestion';
import { ChatAnswer } from './api/ChatAnswer';

@Controller('/api/chat')
@ApiTags('Chat controller')
export class ChatController {
  private readonly logger = new Logger(ChatController.name);

  constructor(private readonly chatService: ChatService) {}

  @Post('/question')
  @ApiOperation({ description: API_DESC_CHAT_QUESTION })
  @ApiBody({
    description: 'Contains question and metadata',
    type: ChatQuestion,
  })
  @ApiOkResponse({
    description: 'Contains answer and metadata',
    type: ChatAnswer,
  })
  async question(@Body() { question }: ChatQuestion): Promise<ChatAnswer> {
    this.logger.debug(`Asking question "${question}"`);

    try {
      return {
        answer: await this.chatService.ask(question),
      };
    } catch (err) {
      throw new HttpException(
        `Chat API response error: ${err}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
