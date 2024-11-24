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
  const [activeMarkerId, setActiveMarkerId] = useState(null); // 開いているInfoWindowFを追跡

  useEffect(() => {
    (async () => {
      try {
        const response = await axios.get("https://okayama-bus-json.vercel.app");
        const data = response.data;

        if (data && data.length > 0) {
          // マーカー情報を状態として保存
          const formattedMarkers = data.map((marker) => ({
            id: marker.vehicle.vehicle.label, // 一意のID
            position: {
              lat: marker.vehicle.position.latitude,
              lng: marker.vehicle.position.longitude,
            },
            title: marker.tripUpdate.trip.routeShortName,
            icon: marker.icon,
            nextStopName:
              marker.tripUpdate.stopTimeUpdate[
                marker.vehicle.currentStopSequence
              ].stopName,
          }));
          setMarkers(formattedMarkers);
        }
      } catch (error) {
        console.error("Error fetching markers:", error);
      }
    })();
  }, []);

  return (
    <LoadScript googleMapsApiKey={process.env.REACT_APP_GOOGLE_API_KEY}>
      <GoogleMap mapContainerStyle={containerStyle} center={center} zoom={17}>
        {markers.map((marker) => (
          <React.Fragment key={marker.id}>
            <MarkerF
              position={marker.position}
              title={marker.title}
              icon={{
                url: marker.icon,
                scaledSize: new window.google.maps.Size(60, 60),
              }}
              onClick={() => setActiveMarkerId(marker.id)} // マーカークリックでInfoWindowFを開く
            />
            {activeMarkerId === marker.id && (
              <InfoWindowF
                position={{
                  lat: marker.position.lat + 0.0005, // 緯度を微増して上方向にずらす
                  lng: marker.position.lng, // 経度はそのまま
                }}
                onCloseClick={() => setActiveMarkerId(null)} // 閉じるときにリセット
              >
                <div>
                  <h4>{marker.title}</h4>
                  <p>
                    {marker.id}号車
                    <br />
                    次は {marker.nextStopName}
                  </p>
                </div>
              </InfoWindowF>
            )}
          </React.Fragment>
        ))}
      </GoogleMap>
    </LoadScript>
  );
};

export default App;
