import { IsInt, Min } from 'class-validator';

export class UpdateOrderItemDto {
  @IsInt()
  @Min(1) // Genellikle miktarı 0'a düşürmek silme işlemiyle yapılır
  quantity: number;
}