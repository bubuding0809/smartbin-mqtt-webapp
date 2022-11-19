import { type NextPage } from "next";
import Head from "next/head";
import mqtt, { MqttClient } from "mqtt";
import { useEffect, useRef, useState } from "react";
import { env } from "../../src/env/client.mjs";
import moment from "moment";
import type { Moment } from "moment";
import BinCard from "../components/BinCard";

const initalizeBins = () => {
  const bins: {
    [key: string]: {
      datetime: Moment | null;
      status: string;
    };
  } = {};
  for (let i = 1; i <= 5; i++) {
    bins[i] = {
      datetime: null,
      status: "-1",
    };
  }
  return bins;
};

const Home: NextPage = () => {
  const [mqttClient, setMqttClient] = useState<MqttClient | null>(null);
  const [messages, setMessages] = useState<
    { topic: string; message: string; datetime: Moment }[]
  >([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [binsStatus, setBinsStatus] = useState(initalizeBins());

  useEffect(() => {
    const client = mqtt.connect(env.NEXT_PUBLIC_MQTT_URL, {
      clientId: "mqtt_" + Math.random().toString(16).substr(2, 8),
      port: parseInt(env.NEXT_PUBLIC_MQTT_PORT),
      username: env.NEXT_PUBLIC_MQTT_USERNAME,
      password: env.NEXT_PUBLIC_MQTT_PASSWORD,
    });

    client.on("connect", () => {
      console.log("connected");
      client.subscribe("trash_collector_main");
      client.subscribe("trash_collector_sub");
    });

    client.on("message", (topic, message) => {
      console.log(topic, message.toString());
      const payload = message.toString();

      // Handle message from main topic (between rev2 and Nano and Web App)
      if (topic === "trash_collector_main") {
        if (payload.startsWith("Unlocked")) {
          setMessages((prev) => [
            ...prev,
            {
              topic: ">>>",
              message: payload,
              datetime: moment(),
            },
          ]);
        } else if (payload.startsWith("status")) {
          const binId = payload.split("-")[1] as string;
          const status = payload.split("-")[2] as string;

          // Prevent update of invalid binId and status
          if (!"0123".includes(status) || !"12345".includes(binId)) return;

          setBinsStatus((prev) => ({
            ...prev,
            [binId]: {
              datetime: moment(),
              status: status,
            },
          }));
        }
        return;
      }

      // Handle messages from the sub topic (between Nano and Web App)
      if (topic == "trash_collector_sub") {
        // Filter out the instruction messages
        if ("0123456789".includes(payload)) return;

        // Add valid messages to the message list
        setMessages((prev) => [
          ...prev,
          {
            topic: ">>>",
            message: payload,
            datetime: moment(),
          },
        ]);
      }
    });

    setMqttClient(client);

    return () => {
      client.unsubscribe("trash_collector_main");
      client.subscribe("trash_collector_sub");
      client.end();
    };
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  return (
    <>
      <Head>
        <title>Home</title>
        <meta name="description" content="Dashboard for smartbin cluster" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="container mx-auto flex min-h-screen flex-col items-center justify-center gap-2 p-4">
        <div className="flex w-full justify-between">
          <h1>
            <span className="text-2xl font-bold">SmartBin</span> Dashboard
          </h1>
          <div className="flex gap-2">
            <button
              className="btn w-28 sm:btn-sm md:btn-md"
              onClick={() => {
                setMessages((prev) => {
                  return [
                    ...prev,
                    {
                      topic: "<<<",
                      message: "Calibrating",
                      datetime: moment(),
                    },
                  ];
                });
                mqttClient?.publish("trash_collector_sub", "0");
              }}
            >
              Calibrate
            </button>
            <button
              className=" btn-secondary btn w-28 sm:btn-sm md:btn-md"
              onClick={() => {
                setMessages((prev) => [
                  ...prev,
                  { topic: "<<<", message: "Docking", datetime: moment() },
                ]);
                mqttClient?.publish("trash_collector_sub", "9");
              }}
            >
              Dock
            </button>
          </div>
        </div>
        <div className="h-40 w-full overflow-y-auto rounded border bg-slate-50 px-4 py-2 shadow-sm">
          {messages.map((message, idx) => (
            <div key={idx}>
              <span>{message.datetime?.format("DD/MM/YYYY HH:mm:ss")}</span>
              <span
                className={`font-bold ${
                  message.topic === "<<<" ? "text-blue-500" : "text-emerald-500"
                }`}
              >
                {message.topic}
              </span>
              <span className="ml-2 font-bold text-slate-900">
                {message.message}
              </span>
            </div>
          ))}
          <div ref={scrollRef}></div>
        </div>

        <div className="flex w-full gap-2 overflow-x-auto rounded-lg border-4 border-slate-600 bg-[#252525] p-4">
          {Object.keys(binsStatus).map((bin) => (
            <BinCard
              key={bin}
              binId={bin}
              binsStatus={binsStatus}
              mqttClient={mqttClient}
              setMessages={setMessages}
            />
          ))}
        </div>
      </main>
    </>
  );
};

export default Home;
