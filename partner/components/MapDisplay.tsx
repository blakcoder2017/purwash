import React from 'react';
import Map, { Marker } from 'react-map-gl';
import { MAPBOX_ACCESS_TOKEN } from '../config';

interface MapDisplayProps {
    latitude: number;
    longitude: number;
}

const LocationPinIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-primary">
        <path fillRule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 005.169-4.4c1.52-2.324 2.223-4.887 2.223-7.482 0-5.142-4.129-9.31-9.282-9.31S2.258 5.28 2.258 10.423c0 2.595.703 5.158 2.223 7.482a16.975 16.975 0 005.169 4.4l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041zM12 11.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z" clipRule="evenodd" />
    </svg>
);


const MapDisplay: React.FC<MapDisplayProps> = ({ latitude, longitude }) => {
    const initialViewState = {
        longitude,
        latitude,
        zoom: 14
    };

    if (!MAPBOX_ACCESS_TOKEN) {
        return <div className="bg-slate-200 aspect-video rounded-lg flex items-center justify-center text-slate-500 text-sm p-4">Mapbox token not configured.</div>
    }

    return (
        <div className="h-48 w-full rounded-lg overflow-hidden">
            <Map
                mapboxAccessToken={MAPBOX_ACCESS_TOKEN}
                initialViewState={initialViewState}
                style={{ width: '100%', height: '100%' }}
                mapStyle="mapbox://styles/mapbox/streets-v11"
                interactive={false}
            >
                <Marker longitude={longitude} latitude={latitude} anchor="bottom">
                    <LocationPinIcon />
                </Marker>
            </Map>
        </div>
    );
};

export default MapDisplay;
