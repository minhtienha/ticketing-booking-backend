import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CommonModule } from '@ticketing/common';
import { ReservationModule } from './reservation/reservation.module';
import { ScheduleModule } from '@nestjs/schedule';
@Module({
  imports: [CommonModule, ReservationModule, ScheduleModule.forRoot()],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
