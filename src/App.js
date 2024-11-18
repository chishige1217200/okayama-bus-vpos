import React, { useEffect, useState } from "react";
import { GoogleMap, LoadScript, Marker } from "@react-google-maps/api";

const containerStyle = {
  height: "100vh",
  width: "100%",
};

const center = {
  lat: 34.663,
  lng: 133.925,
};

const positionF1302 = {
  lat: 34.51649856567383,
  lng: 133.89849853515625,
};

const positionF1908 = {
  lat: 34.62188720703125,
  lng: 133.9432830810547,
};

const App = () => {
  // TODO:ここにバス情報ロード処理が必要

  const [content, setContent] = useState(null);

  useEffect(() => {
    // コンポーネントがマウントされた後に動的に内容を設定
    const timer = setTimeout(() => {
      setContent(
        <>
          <Marker
            position={positionF1302}
            icon={
              "https://loc.bus-vision.jp/ryobi/view/images/common/busicon/10000/2/201_s.png"
            }
            label={"F1302"}
          />
          <Marker
            position={positionF1908}
            icon={
              "https://loc.bus-vision.jp/ryobi/view/images/common/busicon/10000/2/209_s.png"
            }
            label={"F1908"}
          />
        </>
      );
    }, 100); // 0.1秒後にマーカー埋め込み（遅延描画しないとマーカーが表示されないため）

    return () => clearTimeout(timer);
  }, []);

  return (
    <LoadScript googleMapsApiKey="YOUR API KEY">
      <GoogleMap mapContainerStyle={containerStyle} center={center} zoom={17}>
        {content}
      </GoogleMap>
    </LoadScript>
  );
};

export default App;
