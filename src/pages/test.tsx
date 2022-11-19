import { type NextPage } from "next";
import Head from "next/head";
import { signIn, signOut, useSession } from "next-auth/react";
import { trpc } from "../utils/trpc";
import mqtt, { MqttClient } from "mqtt";
import { useEffect, useRef, useState } from "react";
import { env } from "../env/client.mjs";

const Test: NextPage = () => {
  const [mqttClient, setMqttClient] = useState<MqttClient | null>(null);
  const [messageForm, setMessageForm] = useState({
    topic: "",
    message: "",
  });
  const [messages, setMessages] = useState<
    { topic: string; message: string }[]
  >([]);
  const scrollRef = useRef<HTMLDivElement>(null);

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
      setMessages((prev) => [
        ...prev,
        {
          topic,
          message: message.toString(),
        },
      ]);
    });

    setMqttClient(client);

    return () => {
      client.unsubscribe("trash_collector_main");
      client.unsubscribe("trash_collector_sub");
      client.end();
    };
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setMessageForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  return (
    <>
      <Head>
        <title>Test</title>
        <meta name="description" content="Generated by create-t3-app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="container mx-auto flex min-h-screen flex-col items-center justify-center gap-2 p-4">
        <h1 className="text-3xl font-bold">MQTT Messages</h1>
        <div className="h-40 w-full overflow-y-auto rounded border px-4 py-2 shadow-sm">
          {messages.map((message, idx) => (
            <div key={idx}>
              <span className={`font-bold`}>{message.topic}: </span>
              {message.message}
            </div>
          ))}
          <div ref={scrollRef}></div>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <div className="flex flex-col">
            <label htmlFor="topic">Topic</label>
            <input
              id="topic"
              type="text"
              className="rounded border"
              name="topic"
              value={messageForm.topic}
              onChange={handleFormChange}
            />
          </div>
          <div className="flex flex-col">
            <label htmlFor="topic">Message</label>
            <input
              id="topic"
              type="text"
              className="rounded border"
              name="message"
              value={messageForm.message}
              onChange={handleFormChange}
            />
          </div>
          <button
            className="rounded bg-purple-500 px-4 py-2 text-white hover:cursor-pointer"
            onClick={() => {
              mqttClient?.publish(messageForm.topic, messageForm.message);
              setMessageForm((prev) => ({
                ...prev,
                message: "",
              }));
            }}
          >
            Send
          </button>
        </div>
      </main>
    </>
  );
};

export default Test;

const AuthShowcase: React.FC = () => {
  const { data: secretMessage } = trpc.auth.getSecretMessage.useQuery();

  const { data: sessionData } = useSession();

  return (
    <div className="flex flex-col items-center justify-center gap-2">
      {sessionData && (
        <p className="text-2xl text-blue-500">
          Logged in as {sessionData?.user?.name}
        </p>
      )}
      {secretMessage && (
        <p className="text-2xl text-blue-500">{secretMessage}</p>
      )}
      <button
        className="rounded-md border border-black bg-violet-50 px-4 py-2 text-xl shadow-lg hover:bg-violet-100"
        onClick={sessionData ? () => signOut() : () => signIn()}
      >
        {sessionData ? "Sign out" : "Sign in"}
      </button>
    </div>
  );
};