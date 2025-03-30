import { IsString, IsNotEmpty, IsNumber, Min, Length } from 'class-validator';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  @Length(2, 100)
  name: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsString()
  @IsNotEmpty()
  @Length(2, 50)
  category: string;
}