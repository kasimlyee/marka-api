import { HttpService } from '@nestjs/axios';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AxiosError, AxiosResponse } from 'axios';
import { catchError, firstValueFrom, retry, timer } from 'rxjs';
import {
  SmsResponseDto,
  SmsSuccessResponseDto,
  SmsErrorResponseDto,
} from './dto/sms-response.dto';
import { SendSmsDto, SendBatchSmsDto } from './dto/send-sms.dto';
import { SmsModuleOptions } from './interfaces/sms-config.interface';

@Injectable()
export class SmsService implements OnModuleInit {
  private readonly logger = new Logger(SmsService.name);
  private baseUrl: string;
  private readonly config: SmsModuleOptions;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.config = this.loadConfig();
    this.baseUrl = this.config.isSandbox
      ? 'http://sandbox.egosms.co/api/v1/json/'
      : 'https://www.egosms.co/api/v1/json/';
  }

  onModuleInit() {
    this.logger.log('SMS Service initialized');
  }

  private loadConfig(): SmsModuleOptions {
    return {
      username: this.configService.getOrThrow<string>('SMS_USERNAME'),
      password: this.configService.getOrThrow<string>('SMS_PASSWORD'),
      defaultSenderId: this.configService.getOrThrow<string>(
        'SMS_DEFAULT_SENDER_ID',
      ),
      defaultPriority: this.configService.get<number>(
        'SMS_DEFAULT_PRIORITY',
        2,
      ),
      isSandbox: this.configService.get<boolean>('SMS_SANDBOX_MODE', false),
      timeout: this.configService.get<number>('SMS_TIMEOUT', 10000),
      maxRetries: this.configService.get<number>('SMS_MAX_RETRIES', 3),
      retryDelay: this.configService.get<number>('SMS_RETRY_DELAY', 1000),
    };
  }

  async sendSms(smsData: SendSmsDto): Promise<SmsResponseDto> {
    const payload = {
      method: 'SendSms',
      userdata: {
        username: this.config.username,
        password: this.config.password,
      },
      msgdata: [
        {
          number: smsData.number,
          message: encodeURIComponent(smsData.message),
          senderid: encodeURIComponent(
            smsData.senderid || this.config.defaultSenderId,
          ),
          priority:
            smsData.priority?.toString() ||
            this.config.defaultPriority?.toString() ||
            '2',
        },
      ],
    };
    console.log(payload);
    return this.sendRequest(payload);
  }

  async sendBatchSms(batchData: SendBatchSmsDto): Promise<SmsResponseDto> {
    const formattedMsgData = batchData.msgdata.map((msg) => ({
      number: msg.number,
      message: encodeURIComponent(msg.message),
      senderid: encodeURIComponent(msg.senderid || this.config.defaultSenderId),
      priority:
        msg.priority?.toString() ||
        this.config.defaultPriority?.toString() ||
        '2',
    }));

    const payload = {
      method: 'SendSms',
      userdata: {
        username: this.config.username,
        password: this.config.password,
      },
      msgdata: formattedMsgData,
    };

    return this.sendRequest(payload);
  }

  private async sendRequest(payload: any): Promise<SmsResponseDto> {
    try {
      const response: AxiosResponse<SmsResponseDto> = await firstValueFrom(
        this.httpService
          .post(this.baseUrl, payload, {
            timeout: this.config.timeout,
            headers: {
              'Content-Type': 'application/json',
            },
          })
          .pipe(
            retry({
              count: this.config.maxRetries,
              delay: (error: AxiosError, retryCount) => {
                this.logger.warn(
                  `SMS API request failed (attempt ${retryCount}/${this.config.maxRetries}): ${error.message}`,
                );

                return timer(this.config?.retryDelay!);
              },
            }),
            catchError((error: AxiosError) => {
              this.logger.error(
                `SMS API request failed after retries: ${error.message}`,
              );
              throw new Error(
                `Failed to send SMS: ${error.response?.data || error.message}`,
              );
            }),
          ),
      );

      this.handleResponse(response.data);
      return response.data;
    } catch (error) {
      this.logger.error(`SMS sending failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  private handleResponse(response: SmsResponseDto): void {
    if (response.Status === 'OK') {
      const successResponse = response as SmsSuccessResponseDto;
      this.logger.log(
        `SMS sent successfully. Cost: ${successResponse.Cost}, Follow-up code: ${successResponse.MsgFollowUpUniqueCode}`,
      );
    } else {
      const errorResponse = response as SmsErrorResponseDto;
      this.logger.error(`SMS sending failed: ${errorResponse.Message}`);
      throw new Error(`SMS API Error: ${errorResponse.Message}`);
    }
  }

  // Utility method to check account balance
  async checkBalance(): Promise<number> {
    // This would need to be implemented based on EgoSMS API capabilities
    // But am not sure if EgoSMS provides a balance check endpoint
    throw new Error('Balance check not implemented in this version');
  }
}
