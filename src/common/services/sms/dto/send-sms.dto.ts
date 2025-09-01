export class SendSmsDto {
   number: string;
   message: string;
   senderid: string;
   priority?: number;
}

export class SendBatchSmsDto {
   msgdata: SendSmsDto[];
}
