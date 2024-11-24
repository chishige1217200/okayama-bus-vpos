import React, { useEffect, useState } from "react";
import {
  GoogleMap,
  InfoWindowF,
  LoadScript,
  MarkerF,
} from "@react-google-maps/api";
import axios from "axios";

const containerStyle = {
  height: "100vh",
  width: "100%",
};

const center = {
  lat: 34.663,
  lng: 133.925,
};

const App = () => {
  const [markers, setMarkers] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const response = await axios.get("https://okayama-bus-json.vercel.app");
        const data = response.data;
        // console.log(data);
        if (data !== undefined && data !== null && data.length !== 0) {
          // データをもとにマーカー要素を作成
          const markerElements = data.map((marker, index) => (
            <MarkerF
              key={marker.vehicle.vehicle.label}
              position={{
                lat: marker.vehicle.position.latitude,
                lng: marker.vehicle.position.longitude,
              }}
              title={marker.title}
              icon={{
                url: marker.icon,
                scaledSize: new window.google.maps.Size(60, 60),
              }}
            />
          ));

          setMarkers(markerElements);
        }
      } catch (error) {
        console.error("Error fetching markers:", error);
      }
    })();
  }, []);

  return (
    <LoadScript googleMapsApiKey={process.env.REACT_APP_GOOGLE_API_KEY}>
      <GoogleMap mapContainerStyle={containerStyle} center={center} zoom={17}>
        {markers}
      </GoogleMap>
    </LoadScript>
  );
};

export default App;
