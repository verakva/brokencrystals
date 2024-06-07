import { ApiProperty } from '@nestjs/swagger';

export class ChatQuestion {
  @ApiProperty({
    description: 'User question to chatbot',
    example: 'What is the main character in Breaking Bad?',
  })
  question: string;
}
