import { Test, TestingModule } from '@nestjs/testing';
import { ReportCardsController } from './report-cards.controller';

describe('ReportCardsController', () => {
  let controller: ReportCardsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReportCardsController],
    }).compile();

    controller = module.get<ReportCardsController>(ReportCardsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
