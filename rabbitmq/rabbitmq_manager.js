import amqp from "amqplib";
import fs from "fs";
import dotenv from "dotenv";
dotenv.config();
export class RabbitMQManager {
    url = process.env.RABBITMQ_URL;
    queue = "prematch";

    #conn = null;
    #ch = null;

    #connectingPromise = null;
    #offlineQueue = [];
    #running = false;

    #heartbeatSec = 30;

    get connected() {
        return !!this.#conn && !!this.#ch;
    }

    configure({ url, queue } = {}) {
        if (url) this.url = url;
        if (queue) this.queue = queue;
    }

    async #createConnection() {
        const conn = await amqp.connect(this.url, {
            heartbeat: this.#heartbeatSec,
            // TLS options can go here if needed (ca, cert, key, servername...)
        });

        conn.on("error", (err) => {
            console.error("❌ RabbitMQ connection error:", err?.message || err);
        });

        conn.on("close", () => {
            if (this.#conn) console.log("⚠️ RabbitMQ connection closed.");
            this.#conn = null;
            this.#ch = null;
        });

        const ch = await conn.createChannel();
        await ch.assertQueue(this.queue, { durable: true });

        return { conn, ch };
    }

    async connect() {
        if (this.#connectingPromise) return this.#connectingPromise;

        this.#connectingPromise = (async () => {
            try {
                await this.disconnect();
                console.log(`🚀 Connecting to RabbitMQ: ${this.url}`);

                const { conn, ch } = await this.#createConnection();
                this.#conn = conn;
                this.#ch = ch;

                console.log(`✅ Connected to queue '${this.queue}'`);
                return true;
            } catch (e) {
                console.error(`❌ RabbitMQ connect error (${e?.name || "Error"}):`, e?.message || e);
                this.#conn = null;
                this.#ch = null;
                return false;
            } finally {
                this.#connectingPromise = null;
            }
        })();

        return this.#connectingPromise;
    }

    async disconnect() {
        try {
            if (this.#ch) {
                try {
                    await this.#ch.close();
                } catch {}
            }
            if (this.#conn) {
                try {
                    await this.#conn.close();
                } catch {}
            }

            if (this.#conn || this.#ch) console.log("🔌 Disconnected from RabbitMQ.");
        } finally {
            this.#conn = null;
            this.#ch = null;
        }
    }

    async ensureConnection() {
        if (this.connected) return true;
        console.log("⚠️ Connection lost — reconnecting...");
        return this.connect();
    }

    async publishJson(obj) {
        const ok = await this.ensureConnection();
        if (!ok) {
            const line = `⏳ Queuing message (offline): ${JSON.stringify(obj)}\n`;
            fs.appendFileSync(
                "offline_queuing.log",
                line,
                { encoding: "utf8" }
            );
            this.#offlineQueue.push(obj);
            return false;
        }

        try {
            const payload = Buffer.from(JSON.stringify(obj), "utf8");
            const sent = this.#ch.sendToQueue(this.queue, payload, { persistent: true });
            return !!sent;
        } catch (e) {
            const line = `❌ Publish failed: ${e?.message || e}\n`;
            fs.appendFileSync(
                "failed_publish.log",
                line,
                { encoding: "utf8" }
            );
            await this.#forceMarkDisconnected();
            this.#offlineQueue.push(obj);
            return false;
        }
    }

    async #forceMarkDisconnected() {
        try {
            await this.disconnect();
        } catch {
            this.#conn = null;
            this.#ch = null;
        }
    }

    startAutoReconnect(intervalMs = 5000) {
        if (this.#running) return;
        this.#running = true;

        const loop = async () => {
            while (this.#running) {
                try {
                    if (!this.connected) await this.ensureConnection();

                    if (this.connected && this.#offlineQueue.length > 0) {
                        while (this.#offlineQueue.length > 0 && this.connected) {
                            const obj = this.#offlineQueue.shift();
                            const ok = await this.publishJson(obj);
                            if (!ok) break;
                        }
                    }
                } catch (e) {
                    console.error("⚠️ Background loop error:", e?.message || e);
                }

                await new Promise((r) => setTimeout(r, intervalMs));
            }
        };

        loop();
    }

    stopAutoReconnect() {
        this.#running = false;
    }
}
// async function run() {
//     const mq = new RabbitMQManager();
//     mq.configure({queue: "prematch"});
//     await mq.connect();
//     for (let i = 0; i < 10; i++) {
//         // eslint-disable-next-line no-await-in-loop
//         await mq.publishJson({msg: `hello ${i}`});
//         // eslint-disable-next-line no-await-in-loop
//         await new Promise((r) => setTimeout(r, 2000));
//     }
// }
// run().catch((err) => console.error("Error:", err));