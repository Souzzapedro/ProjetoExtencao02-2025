// src/typings/leaflet-routing-machine.d.ts
import * as L from 'leaflet';

// Augmenta o namespace de tipos do Leaflet com "Routing"
declare module 'leaflet' {
  namespace Routing {
    interface Waypoint {
      latLng: L.LatLng;
      name?: string;
    }

    interface Control extends L.Control {
      getPlan(): any;
      setWaypoints(waypoints: (L.LatLng | Waypoint)[]): void;
      on(type: 'routesfound' | 'routingerror' | string, fn: (e: any) => void): this;
      remove(): this;
      addTo(map: L.Map): this;
    }

    function control(options?: any): Control;
    function osrmv1(options?: any): any;
  }
}
