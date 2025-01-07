import { IsNumber, IsNotEmpty } from 'class-validator';

export class GetScooterLocationDto {
  @IsNotEmpty()
  @IsNumber()
  latitude: number;

  @IsNotEmpty()
  @IsNumber()
  longitude: number;
}
