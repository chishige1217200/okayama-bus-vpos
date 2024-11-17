import React from "react";
import { GoogleMap, LoadScript } from "@react-google-maps/api";

const containerStyle = {
  height: "100vh",
  width: "100%",
};

const center = {
  lat: 34.66300000,
  lng: 133.9250000,
};

const App = () => {
  return (
    <LoadScript googleMapsApiKey="YOUR API KEY">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={17}
      ></GoogleMap>
    </LoadScript>
  );
};

export default App;
