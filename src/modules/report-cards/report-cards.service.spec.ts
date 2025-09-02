import { Test, TestingModule } from '@nestjs/testing';
import { ReportCardsService } from './report-cards.service';

describe('ReportCardsService', () => {
  let service: ReportCardsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ReportCardsService],
    }).compile();

    service = module.get<ReportCardsService>(ReportCardsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
