import { Inject, Injectable } from '@nestjs/common';
// import { Cache } from 'cache-manager';

@Injectable()
export class AppService {
  // constructor(@Inject('CACHE_MANAGER') private cacheManager: Cache) {}

  async getData(): Promise<[{ id: number; name: string }]> {
    console.log('CONTROLLER EXECUTED');
    await new Promise((resolve) => setTimeout(resolve, 3000));
    return [{ id: 1, name: 'Nest' }];
  }
}
