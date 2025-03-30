import { IsUUID, IsInt, Min } from 'class-validator';

export class AddOrderItemDto {
  @IsUUID()
  productId: string;

  @IsInt()
  @Min(1)
  quantity: number;
}