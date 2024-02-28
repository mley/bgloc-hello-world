import {Component} from '@angular/core';
import {BehaviorSubject, interval, of} from "rxjs";
import BackgroundGeolocation from "@transistorsoft/capacitor-background-geolocation";
import {catchError, exhaustMap, filter} from "rxjs/operators";
import {fromPromise} from "rxjs/internal/observable/innerFrom";

export interface LogEntry {
    type: string,
    message: string,
}

@Component({
    selector: 'app-home',
    templateUrl: 'home.page.html',
    styleUrls: ['home.page.scss'],
})
export class HomePage {

    protected log$ = new BehaviorSubject<LogEntry[]>([]);

    constructor() {
    }

    private log(type: string, e: any) {
        console.log(type, e);
        this.log$.next([{type, message: JSON.stringify(e, null, 2)}, ...this.log$.value]);
    }


    private async tryAndLog(type: string, fn: () => Promise<any>) {
        try {
            const result = await fn();
            this.log(type, result);
        } catch (e) {
            this.log('error', e);
        }
    }

    public async ready(): Promise<void> {
        await this.tryAndLog('ready', () => BackgroundGeolocation.ready({
            // Geolocation Config
            desiredAccuracy: BackgroundGeolocation.DESIRED_ACCURACY_HIGH,
            desiredOdometerAccuracy: 10,
            locationAuthorizationRequest: 'WhenInUse',

            //iOS only
            stationaryRadius: 5,
            showsBackgroundLocationIndicator: true,
            activityType: 3, //ACTIVITY_TYPE_FITNESS
            preventSuspend: true,

            //Android only
            allowIdenticalLocations: true,
            foregroundService: true,
            backgroundPermissionRationale: {
                title: "Allow to access your location while you are using the app?",
                message: "App needs access to your location to track your activities",
                positiveAction: "Allow",
                negativeAction: "Deny",
            },
            notification: {
                title: 'Tracking',
                text: 'Tracking your location',
            },
            geofenceModeHighAccuracy: true,

            // Application config
            debug: false, // <-- enable this hear sounds for background-geolocation life-cycle.
            logLevel: BackgroundGeolocation.LOG_LEVEL_VERBOSE,
        }));
    }

    public async requestPermissions(): Promise<void> {
        await this.tryAndLog('requestPermission', () => BackgroundGeolocation.requestPermission());
    }

    public async start(): Promise<void> {
        await this.tryAndLog('start', () => BackgroundGeolocation.start());
    }



    public async getCurrentPosition(): Promise<void> {
        await this.tryAndLog('getCurrentPosition', () =>
        BackgroundGeolocation.getCurrentPosition({
            desiredAccuracy: BackgroundGeolocation.DESIRED_ACCURACY_HIGH,
            timeout: 10,
            persist: true,
        }));
    }


}
