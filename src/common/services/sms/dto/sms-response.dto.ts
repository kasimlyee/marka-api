export class SmsSuccessResponseDto {
  Status: string;
  Cost: string;
  MsgFollowUpUniqueCode: string;
}

export class SmsErrorResponseDto {
  Status: string;
  Message: string;
}

export type SmsResponseDto = SmsSuccessResponseDto | SmsErrorResponseDto;
