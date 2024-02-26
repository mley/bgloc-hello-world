import { Component } from '@angular/core';
import {interval, Observable, Subject} from "rxjs";
import {GpsLocation, LocationService} from "./location.service";

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {


  protected location: Observable<GpsLocation> | undefined;

  constructor(
      private readonly locationService: LocationService,
  ) {}

  public async init(): Promise<void> {
    await this.locationService.initialize();
  }

  public startLocationTracking(): void {
    this.location = this.locationService.startLocationTracking()
  }
}
