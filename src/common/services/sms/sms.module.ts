import { Module, Global, DynamicModule, Provider } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { SmsService } from './sms.service';
import { SmsModuleOptions } from './interfaces/sms-config.interface';
import { SMS_CONFIG_OPTIONS } from './sms.constants';


@Module({})
export class SmsModule {
  static forRoot(options: SmsModuleOptions): DynamicModule {
    return {
      module: SmsModule,
      imports: [HttpModule],
      providers: [
        {
          provide: SMS_CONFIG_OPTIONS,
          useValue: options,
        },
        SmsService,
      ],
      exports: [SmsService],
    };
  }

  static forRootAsync(options: {
    useFactory: (
      ...args: any[]
    ) => Promise<SmsModuleOptions> | SmsModuleOptions;
    inject?: any[];
  }): DynamicModule {
    const providers: Provider[] = [
      {
        provide: SMS_CONFIG_OPTIONS,
        useFactory: options.useFactory,
        inject: options.inject || [],
      },
      SmsService,
    ];

    return {
      module: SmsModule,
      imports: [HttpModule],
      providers,
      exports: [SmsService],
    };
  }
}
