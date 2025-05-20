import { TestBed } from '@angular/core/testing';

import { VideoAudioService } from './video-audio.service';

describe('VideoAudioService', () => {
  let service: VideoAudioService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(VideoAudioService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
