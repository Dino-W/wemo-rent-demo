import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ResponseFormatInterceptor } from 'src/common/interceptors/global-response-format.interceptor';
import { LoggingInterceptor } from 'src/common/interceptors/global-logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalInterceptors(
    new ResponseFormatInterceptor(),
    new LoggingInterceptor()
  );

  app.setGlobalPrefix('api');

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
