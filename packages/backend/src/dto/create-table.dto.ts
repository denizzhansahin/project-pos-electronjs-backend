import { IsString, IsNotEmpty, Length } from 'class-validator';

export class CreateTableDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 50)
  name: string;
}