import React, { useEffect, useState } from "react";
import {
  GoogleMap,
  InfoWindowF,
  LoadScript,
  MarkerF,
  OverlayView,
} from "@react-google-maps/api";
import axios from "axios";
import "./App.css";

const containerStyle = {
  height: "100vh",
  width: "100%",
};

const App = () => {
  const [markers, setMarkers] = useState([]);
  const [activeMarkerId, setActiveMarkerId] = useState(null); // 開いているInfoWindowFを追跡
  const [isLoading, setIsLoading] = useState(true); // ローディング状態
  const [center, setCenter] = useState({ lat: 34.663, lng: 133.925 }); // 初期値
  const [userLocation, setUserLocation] = useState(null); // ユーザーの現在地

  // stopSequenceを基準に次のstopNameを取得する関数
  const getNextStopName = (stops, currentSequence) => {
    // 現在のstopSequenceのインデックスを取得
    const currentIndex = stops.findIndex(
      (stop) => stop.stopSequence === currentSequence
    );

    // 次のインデックスが存在する場合は、stopNameを返す
    if (currentIndex !== -1 && currentIndex + 1 < stops.length) {
      return stops[currentIndex + 1].stopName;
    }

    // 次のインデックスが存在しない場合は、現在のstopNameを返す
    return stops[currentIndex]?.stopName || "";
  };

  // 遅れ時分を計算する関数
  const calcDelay = (stops, currentSequence) => {
    // 現在のstopSequenceのインデックスを取得
    const currentIndex = stops.findIndex(
      (stop) => stop.stopSequence === currentSequence
    );

    // 現在のインデックスが存在する場合は、現在の遅れ時分を返す
    if (currentIndex !== -1 && currentIndex < stops.length) {
      return Math.floor(stops[currentIndex].arrival.delay / 60) ?? null; // 正常に遅れ時分が取得できない場合はnull
    }

    // インデックスが取得できない場合は、始発時点の遅れ時分を返す
    return Math.floor(stops[0].arrival.delay / 60) ?? null; // 正常に遅れ時分が取得できない場合はnull
  };

  const fetchMarkers = async () => {
    try {
      console.log("Fetching markers...");
      const response = await axios.get("https://okayama-bus-json.vercel.app");
      const data = response.data;
      console.log("Markers fetched.");

      if (data) {
        if (data.length > 0) {
          // マーカー情報を状態として保存
          const formattedMarkers = data.map((marker) => ({
            id: marker.vehicle.vehicle.id, // 一意のID
            label: marker.vehicle.vehicle.label, // 車両番号
            position: {
              lat: marker.vehicle.position.latitude, // 緯度
              lng: marker.vehicle.position.longitude, // 経度
            },
            title: marker.tripUpdate.trip.routeShortName, // 路線名
            icon: marker.icon,
            nextStopName: getNextStopName(
              marker.tripUpdate.stopTimeUpdate,
              marker.vehicle.currentStopSequence
            ), // 次の停留所
            destinationStopName: marker.tripUpdate.trip.destinationStopName, // 行き先
            delay: calcDelay(
              marker.tripUpdate.stopTimeUpdate,
              marker.vehicle.currentStopSequence
            ), // 遅延時間（分）
            occupancyStatus: marker.vehicle.occupancyStatus, // 混雑状況
          }));
          setMarkers(formattedMarkers);
        } else {
          // 運行終了時、全てのバスが非表示になるように
          setMarkers([]);
        }
      }
    } catch (error) {
      console.error("Error fetching markers:", error);
    } finally {
      setIsLoading(false); // データ取得完了時にローディングを解除
    }
  };

  useEffect(() => {
    fetchMarkers(); // 初回実行

    const interval = setInterval(() => {
      fetchMarkers(); // 20秒ごとに実行
    }, 20000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCenter({ lat: latitude, lng: longitude }); // 現在地を中心に設定
          setUserLocation({ lat: latitude, lng: longitude }); // 現在地を保存
        },
        (error) => {
          console.error("Error getting location:", error);
        }
      );
    } else {
      console.warn("Geolocation is not supported by this browser.");
    }
  }, []);

  return (
    <LoadScript googleMapsApiKey={process.env.REACT_APP_GOOGLE_API_KEY}>
      <div style={{ position: "relative" }}>
        {/* ローディング画面 */}
        {isLoading && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              display: "flex",
              flexDirection: "column", // 縦方向に配置
              justifyContent: "center", // 垂直方向の中央揃え
              alignItems: "center", // 水平方向の中央揃え
              zIndex: 10,
              color: "white",
            }}
          >
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "40px", marginBottom: "10px" }}>
                Now Loading...
              </div>
              <p style={{ fontSize: "18px", margin: 0 }}>
                <b>ご利用上の注意</b>
                <br />
                本データをご利用された結果、あるいは使用できない等により直接的または間接的に生じたあらゆる損害、損失については、当システム管理者および各バス事業者は一切の責任を負いません。
                <br />
                本データは、バスの運行情報等を提供することで、利用者の利便性を図るものですが、その情報等についての安全性、確実性、有用性などの保証は負いかねますので、あらかじめご了承ください。
                <br />
                本データの正確性について、万全を期しておりますが利用者がデータを用いて行う一切の行為について、当システム管理者および各バス事業者は一切の責任を負いません。
                <br />
                ※情報の表示に数秒かかる場合があります。しばらくお待ちください。
                <br />
                <br />
                データ提供元：
                <a href="https://loc.bus-vision.jp/ryobi/view/opendata.html">
                  Bus-Vision
                </a>
                　バス事業者：
                <a href="https://www.ryobi-holdings.jp/bus/">両備バス</a>
              </p>
            </div>
          </div>
        )}
        <div
          style={{
            position: "absolute",
            top: 10,
            right: 60,
            display: "flex",
            zIndex: 5,
            color: "white",
          }}
        >
          <button className="google-style-btn" onClick={() => fetchMarkers()}>
            更新
          </button>
        </div>
        <GoogleMap mapContainerStyle={containerStyle} center={center} zoom={17}>
          {userLocation && (
            <OverlayView
              position={userLocation}
              mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
            >
              <div className="pulse-container">
                <img src="/bluedot.png" alt="現在地" className="pulse-dot" />
                <div className="pulse-ring"></div>
              </div>
            </OverlayView>
          )}
          {markers.map((marker) => (
            <React.Fragment key={marker.id}>
              <OverlayView
                position={marker.position}
                mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
              >
                <div
                  style={{
                    backgroundColor: "#3e3a39", // 背景色
                    color: "white", // 文字色
                    padding: "5px 10px", // テキスト周囲に余白を確保
                    borderRadius: "5px", // 枠を角丸にする
                    textAlign: "center", // テキストを中央揃え
                    whiteSpace: "nowrap", // テキストを1行で表示
                    fontSize: "14px", // 適切なフォントサイズ
                    lineHeight: "1.5", // 行の高さを調整して中央揃えを自然にする
                    transform: "translate(-50%, -300%)", // 中央揃えでマーカー上部に表示
                    display: "inline-block", // ブロック幅の調整
                  }}
                >
                  {marker.title.includes("特急")
                    ? `特急 ${marker.destinationStopName}`
                    : marker.destinationStopName}
                </div>
              </OverlayView>
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
                  position={marker.position} // マーカー座標を指定
                  options={{
                    pixelOffset: new window.google.maps.Size(0, -100), // マーカーとの相対位置を指定
                  }}
                  onCloseClick={() => setActiveMarkerId(null)} // 閉じるときにリセット
                >
                  <div>
                    <h4 style={{ textAlign: "center" }}>{marker.title}</h4>
                    <p style={{ textAlign: "center" }}>
                      {marker.label}号車
                      <br />
                      <b>次は {marker.nextStopName}</b>
                      <br />
                      {marker.delay !== undefined && marker.delay !== null
                        ? marker.delay > 0
                          ? "約" + marker.delay + "分遅れ"
                          : "ほぼ定刻"
                        : "遅れ情報が取得できません"}
                      <br />
                      {marker.occupancyStatus}
                      <br />
                      <a
                        href={
                          "https://loc.bus-vision.jp/ryobi/view/vehicleState.html?vehicleCorpCd=3&vehicleCd=" +
                          marker.id +
                          "&lang=0"
                        } // 両備バス以外はvehicleCorpCdが違う
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        詳しい運行状況
                      </a>
                    </p>
                  </div>
                </InfoWindowF>
              )}
            </React.Fragment>
          ))}
        </GoogleMap>
      </div>
    </LoadScript>
  );
};

export default App;
