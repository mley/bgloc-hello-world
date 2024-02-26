import { Component } from '@angular/core';
import {interval, Observable, Subject} from "rxjs";
import {GpsLocation, LocationService} from "./location.service";

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {

  private error$ = new Subject<string>();
 protected error: Observable<string> = this.error$.asObservable();
  protected location: Observable<GpsLocation> | undefined;

  constructor(
      private readonly locationService: LocationService,
  ) {}

  public async init(): Promise<void> {
    try {
      await this.locationService.initialize();
    } catch (e) {
      this.error$.next(`${e}`);
    }
  }

  public startLocationTracking(): void {
    this.location = this.locationService.startLocationTracking()
  }
}
