// src/screens/MapScreen.tsx
import React from 'react';
import { View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

const MapScreen: React.FC = () => {
    return (
        <View className="flex-1">
            <MapView
                className="w-full h-full"
                initialRegion={{
                    latitude: 18.4861,        // Santo Domingo
                    longitude: -69.9312,
                    latitudeDelta: 0.0922,
                    longitudeDelta: 0.0421,
                }}
            >
                <Marker
                    coordinate={{ latitude: 18.4861, longitude: -69.9312 }}
                    title="Estás aquí"
                    description="Ubicación actual"
                />
            </MapView>
        </View>
    );
};

export default MapScreen;
