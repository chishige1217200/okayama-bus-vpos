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
  const [filteredMarkers, setFilteredMarkers] = useState([]); // 検索後のフィルタリング結果
  const [searchQuery, setSearchQuery] = useState(""); // 検索キーワード
  const [activeMarkerId, setActiveMarkerId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

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
    return stops[currentIndex].stopName;
  };

  const fetchMarkers = async () => {
    try {
      const response = await axios.get("https://okayama-bus-json.vercel.app");
      const data = response.data;

      if (data && data.length > 0) {
        // マーカー情報を状態として保存
        const formattedMarkers = data.map((marker) => ({
          id: marker.vehicle.vehicle.id, // 一意のID
          label: marker.vehicle.vehicle.label,
          position: {
            lat: marker.vehicle.position.latitude,
            lng: marker.vehicle.position.longitude,
          },
          title: marker.tripUpdate.trip.routeShortName,
          icon: marker.icon,
          nextStopName: getNextStopName(
            marker.tripUpdate.stopTimeUpdate,
            marker.vehicle.currentStopSequence
          ),
        }));

        setMarkers(formattedMarkers); // markersを更新

        // 現在の検索キーワードに基づいてfilteredMarkersを更新
        if (searchQuery === "") {
          setFilteredMarkers(formattedMarkers); // 検索キーワードが空の場合はすべて表示
        } else {
          const lowerCaseQuery = searchQuery.toLowerCase();
          const filtered = formattedMarkers.filter(
            (marker) =>
              marker.title.toLowerCase().includes(lowerCaseQuery) ||
              marker.label.toLowerCase().includes(lowerCaseQuery)
          );
          setFilteredMarkers(filtered); // 検索結果をfilteredMarkersに反映
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

    return () => clearInterval(interval); // クリーンアップ
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 検索ロジック
  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query === "") {
      setFilteredMarkers(markers); // 空白の場合はすべて表示
    } else {
      const lowerCaseQuery = query.toLowerCase();
      const filtered = markers.filter(
        (marker) =>
          marker.title.toLowerCase().includes(lowerCaseQuery) ||
          marker.label.toLowerCase().includes(lowerCaseQuery)
      );
      setFilteredMarkers(filtered);
    }
  };

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
        {/* 検索フォーム */}
        <div
          style={{
            position: "absolute",
            top: 10,
            left: 10,
            zIndex: 1000,
            background: "white",
            padding: "10px",
            borderRadius: "8px",
            boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
          }}
        >
          <input
            type="text"
            placeholder="検索 (例: 路線名または号車番号)"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            style={{
              width: "200px",
              padding: "5px",
              fontSize: "16px",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          />
        </div>
        <GoogleMap mapContainerStyle={containerStyle} center={center} zoom={17}>
          {filteredMarkers.map((marker) => (
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
                    <h4 style={{ textAlign: "center" }}>{marker.title}</h4>
                    <p style={{ textAlign: "center" }}>
                      {marker.label}号車
                      <br />
                      <b>次は {marker.nextStopName}</b>
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
