declare module 'react-leaflet-rotate' {
    import { ControlPosition } from 'leaflet';
    import { ReactElement } from 'react';

    interface MapRotateProps {
        position?: ControlPosition;
    }

    export function MapRotate(props: MapRotateProps): ReactElement | null;
}