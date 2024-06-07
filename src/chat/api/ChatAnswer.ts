import { ApiProperty } from '@nestjs/swagger';

export class ChatAnswer {
  @ApiProperty({
    description: 'Answer to the user question from chatbot',
    example:
      'The main character in the TV series Breaking Bad is Walter White.',
  })
  answer: string;
}
