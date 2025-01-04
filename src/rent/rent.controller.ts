import { Controller, Post, Body, Get } from '@nestjs/common';
import { RentService } from './rent.service';

@Controller('rent')
export class RentController {
  constructor(private readonly rentService: RentService) {}

  @Post('/returnScooter')
  async returnScooter() {
    return this.rentService.returnScooter();
  }
}
