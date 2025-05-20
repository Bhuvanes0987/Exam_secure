import { TestBed } from '@angular/core/testing';

import { AudioDetectorService } from './audio-detector.service';

describe('AudioDetectorService', () => {
  let service: AudioDetectorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AudioDetectorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
