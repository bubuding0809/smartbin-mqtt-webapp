import type { MqttClient } from "mqtt";
import moment from "moment";
import type { Moment } from "moment";

const binStatusMessage: {
  [key: string]: string;
} = {
  "-1": "Unknown",
  "0": "Empty",
  "1": "1/3 Full",
  "2": "2/3 Full",
  "3": "3/3 Full",
};

const BinCard = ({ binId, binsStatus, mqttClient, setMessages }: any) => {
  return (
    <div className="flex w-60 flex-shrink-0 flex-col justify-between gap-2 rounded-lg bg-slate-50 p-2 shadow-md">
      <div>
        <h1 className="text-lg font-bold text-slate-900">
          Bin {binId} status:{" "}
          <span className="rounded-lg font-light">
            {binStatusMessage[binsStatus[binId]!.status]}
          </span>
          <span className="block text-sm font-light">
            last updated:{" "}
            {binsStatus[binId]!.datetime?.format("DD/MM/YYYY HH:mm:ss") ?? "-"}
          </span>
        </h1>
      </div>
      <div
        className={`flex flex-col gap-2 rounded-lg border-4 border-black/50 p-2 ${
          binsStatus[binId]!.status === "-1" ? "animate-pulse" : ""
        }`}
      >
        <div
          className={`h-20 w-full ${
            binsStatus[binId]!.status == "3" ? "bg-red-600" : "bg-slate-300"
          }`}
        ></div>
        <div
          className={`h-20 w-full 
          ${binsStatus[binId]!.status == "3" ? "bg-red-600" : "bg-slate-300"}
          ${binsStatus[binId]!.status == "2" ? "bg-yellow-600" : "bg-slate-300"}
        `}
        ></div>
        <div
          className={`h-20 w-full 
          ${binsStatus[binId]!.status == "3" ? "bg-red-600" : "bg-slate-300"}
          ${binsStatus[binId]!.status == "2" ? "bg-yellow-600" : "bg-slate-300"}
          ${
            binsStatus[binId]!.status == "1" ? "bg-emerald-600" : "bg-slate-300"
          }
        `}
        ></div>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          className="btn-primary btn-block btn"
          onClick={() => {
            setMessages((prev: any) => {
              return [
                ...prev,
                {
                  topic: "<<<",
                  message: "Collecting",
                  datetime: moment(),
                },
              ];
            });
            mqttClient?.publish("trash_collector_sub", binId);
          }}
        >
          Collect
        </button>
      </div>
    </div>
  );
};

export default BinCard;
