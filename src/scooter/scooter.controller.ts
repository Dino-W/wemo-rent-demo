import { Controller, Get, Query } from '@nestjs/common';
import { API_PATHS } from 'src/common/constant/api-pahts.constant';
import { ScooterService } from './scooter.service';
import { GetScooterLocationDto } from './dto/scooterLocation.dto';

@Controller(API_PATHS.SCOOTER.BASE)
export class ScooterController {
  constructor(private readonly scooterService: ScooterService) {}

  @Get(API_PATHS.SCOOTER.GETLOCATION)
  async getScooterLocation(@Query() query: GetScooterLocationDto) {
    const result = this.scooterService.getScooterLocation(query);
    return result;
  }
}
