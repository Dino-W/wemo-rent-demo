import { Controller, Post, Body, Get } from '@nestjs/common';
import { RentService } from './rent.service';
import { RentScooterDto } from './dto/rentScooter.dto';
import { ReturnScooterDto } from './dto/returnScooter.dto';

@Controller('rent')
export class RentController {
  constructor(private readonly rentService: RentService) {}

  @Post('/rentScooter')
  async rentScooter(@Body() req: RentScooterDto) {
    const result = this.rentService.rentScooter(req);
    return result;
  }

  @Post('/returnScooter')
  async returnScooter(@Body() req: ReturnScooterDto) {
    const result = this.rentService.returnScooter(req);
    return result;
  }
}
