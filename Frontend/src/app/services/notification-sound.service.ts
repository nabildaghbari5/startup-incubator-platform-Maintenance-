import { Injectable, OnDestroy, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Howl, Howler } from 'howler';

@Injectable({ providedIn: 'root' })
export class NotificationSoundService implements OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  private sound?: Howl;
  private userInteracted = false;
  private pendingPlay = false;

  constructor() {
    if (!isPlatformBrowser(this.platformId)) return;

    this.sound = new Howl({
      src: ['/assets/sounds/notification2.mp3'],
      volume: 0.7,
      preload: true,
      onloaderror: (_id, err) => console.error('[NotificationSound] Fichier introuvable:', err),
    });

    const onInteraction = () => {
      this.userInteracted = true;
      void this.resumeContext();
      if (this.pendingPlay) {
        this.pendingPlay = false;
        this.playNow();
      }
    };

    document.addEventListener('click', onInteraction);
    document.addEventListener('keydown', onInteraction);
    document.addEventListener('touchstart', onInteraction);

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') void this.resumeContext();
    });
  }

  unlock(): void {
    this.userInteracted = true;
    void this.resumeContext();
    if (this.pendingPlay) {
      this.pendingPlay = false;
      this.playNow();
    }
  }

  play(): void {
    if (!this.sound) return;

    if (!this.userInteracted) {
      this.pendingPlay = true;
      return;
    }

    void this.resumeContext().then(() => this.playNow());
  }

  private playNow(): void {
    if (!this.sound || !this.userInteracted) return;

    if (this.sound.playing()) {
      this.sound.seek(0);
    } else {
      this.sound.play();
    }
  }

  private resumeContext(): Promise<void> {
    const ctx = Howler.ctx;
    if (ctx?.state === 'suspended') {
      return ctx.resume().catch(() => undefined);
    }
    return Promise.resolve();
  }

  ngOnDestroy(): void {
    this.sound?.unload();
  }
}
