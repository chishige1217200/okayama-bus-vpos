import fs from "fs/promises";
import csvParser from "csv-parser";
import axios from "axios";
import protobuf from "protobufjs";

// gtfs-realtime.protoを読込
const loadProto = () => protobuf.load("../gtfs-realtime.proto");

// データの取得
const fetchData = async (source, isLocal = false) => {
  return isLocal
    ? fs.readFile(source) // ローカルファイルを読込
    : (await axios.get(source, { responseType: "arraybuffer" })).data; // リモートファイルを取得
};

// データを解析して配列を返す
const parseData = async (source, isLocal = false) => {
  try {
    const root = await loadProto();
    const FeedMessage = root.lookupType("transit_realtime.FeedMessage");

    // データの取得
    const binaryData = await fetchData(source, isLocal);

    // デコードとオブジェクト化
    const message = FeedMessage.decode(binaryData);
    const parsedArray = FeedMessage.toObject(message, {
      longs: String,
      enums: String,
      bytes: String,
    }).entity;

    // console.log("Parsed Data Array:", JSON.stringify(parsedArray, null, 2));
    return parsedArray;
  } catch (error) {
    console.error("Error parsing data:", error);
    return [];
  }
};

export const getInfo = async () => {
  let returnArray = null;
  const ryobiArray = await parseData(
    "https://loc.bus-vision.jp/realtime/ryobi_vpos_update.bin"
  );
  const ryobiArray2 = await parseData(
    "https://loc.bus-vision.jp/realtime/ryobi_trip_update.bin"
  );
  // const ryobiArray = await parseData("../ryobi_vpos_update.bin", true);
  // const ryobiArray2 = await parseData("../ryobi_trip_update.bin", true);

  // 配列のマージ
  if (ryobiArray !== undefined && ryobiArray2 !== undefined) {
    returnArray = ryobiArray.map((item1, index) => {
      const item2 = ryobiArray2[index];
      return {
        ...item1,
        tripUpdate: item2.tripUpdate,
      };
    });

    // console.log(JSON.stringify(returnArray, null, 2));
  }

  return returnArray;
};
