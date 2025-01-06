import { Controller, Post, Body, Get } from '@nestjs/common';
import { API_PATHS } from 'src/common/constant/api-pahts.constant';
import { RentService } from './rent.service';
import { RentScooterDto } from './dto/rentScooter.dto';
import { ReturnScooterDto } from './dto/returnScooter.dto';

@Controller(API_PATHS.RENT.BASE)
export class RentController {
  constructor(private readonly rentService: RentService) {}

  @Post(API_PATHS.RENT.RENT)
  async rentScooter(@Body() req: RentScooterDto) {
    const result = this.rentService.rentScooter(req);
    return result;
  }

  @Post(API_PATHS.RENT.RETURN)
  async returnScooter(@Body() req: ReturnScooterDto) {
    const result = this.rentService.returnScooter(req);
    return result;
  }
}
