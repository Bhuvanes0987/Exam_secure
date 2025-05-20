import { TestBed } from '@angular/core/testing';

import { FaceDetectorService } from './face-detector.service';

describe('FaceDetectorService', () => {
  let service: FaceDetectorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FaceDetectorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
