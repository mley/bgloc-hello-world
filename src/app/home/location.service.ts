import {Injectable, OnDestroy} from '@angular/core';
import {interval, Observable, of, Subject} from 'rxjs';
import BackgroundGeolocation, {Subscription} from '@transistorsoft/capacitor-background-geolocation';
import {fromPromise} from 'rxjs/internal/observable/innerFrom';
import {catchError, exhaustMap, filter, takeUntil} from 'rxjs/operators';

export interface GpsLocation {
    latitude: number;
    longitude: number;
    altitude?: number;
    bearing?: number;
}

@Injectable({
    providedIn: 'root',
})
export class LocationService implements OnDestroy {

    private destroy$: Subject<void> | undefined;

    constructor() {
    }

    ngOnDestroy(): void {
        this.subscriptions.forEach(s => s.remove());
        this.subscriptions.length = 0;
    }

    private async getPosition(): Promise<GpsLocation> {
        const location = await BackgroundGeolocation.getCurrentPosition({
            desiredAccuracy: BackgroundGeolocation.DESIRED_ACCURACY_HIGH,
            timeout: 10,
            persist: true,
        });
        return {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            altitude: location.coords.altitude,
            bearing: location.coords.heading,
        };
    }

    /**
     * Start continuous location tracking.
     *
     * @returns Observable of locations
     */
    public startLocationTracking(): Observable<GpsLocation> {
        if (!!this.destroy$) {
            this.destroy$.next();
        }
        this.destroy$ = new Subject<void>();

        console.log('start watchLocation');

        // @ts-ignore
        return interval(1000).pipe(
            takeUntil(this.destroy$),
            exhaustMap(() => fromPromise(this.getPosition())),
            catchError(error => {
                console.error('watchLocation error', error);
                return of(undefined);
            }),
            filter(location => !!location)
        );
    }

    /**
     * Stop the continuous location tracking.
     */
    public async stopLocationTracking(): Promise<void> {
        console.log('stop watchLocation');
        if (!!this.destroy$) {
            this.destroy$.next();
        }
        await BackgroundGeolocation.stop();
    }

    private subscriptions: Subscription[] = [];

    public async initialize(): Promise<void> {
        try {
            if (this.subscriptions.length > 0) {
                this.subscriptions.push(
                    BackgroundGeolocation.onLocation(location => {
                        console.log('onLocation', location);
                    })
                );

                this.subscriptions.push(
                    BackgroundGeolocation.onMotionChange(event => {
                        console.log('onMotionChange', event);
                    })
                );

                this.subscriptions.push(
                    BackgroundGeolocation.onActivityChange(event => {
                        console.log('onActivityChange', event);
                    })
                );

                this.subscriptions.push(
                    BackgroundGeolocation.onProviderChange(event => {
                        console.log('onProviderChange', event);
                    })
                );
            }

            const readyState = await BackgroundGeolocation.ready({
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
            });

            console.log('ready state', readyState);

            const startState = await BackgroundGeolocation.start();

            console.log('start state', startState);
        } catch (error) {
            console.error('initialize error', error);
            throw error;
        }
    }
}
