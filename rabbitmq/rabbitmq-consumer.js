// rabbitmq-consumer.js
import amqp from "amqplib";
import dotenv from "dotenv";
dotenv.config();
export class RabbitMQConsumer {
    url = process.env.RABBITMQ_URL;

    queue = "prematch_855bet";

    prefetch = 1; // 👈 very important for OCR / CPU-heavy work

    #conn = null;
    #ch = null;
    #running = false;

    configure({ url, queue, prefetch } = {}) {
        if (url) this.url = url;
        if (queue) this.queue = queue;
        if (prefetch !== undefined) this.prefetch = prefetch;
    }

    get connected() {
        return !!this.#conn && !!this.#ch;
    }

    async connect() {
        try {
            console.log(`🚀 Consumer connecting: ${this.url}`);

            this.#conn = await amqp.connect(this.url, { heartbeat: 30 });

            this.#conn.on("close", () => {
                console.log("⚠️ Consumer connection closed");
                this.#conn = null;
                this.#ch = null;
            });

            this.#conn.on("error", (err) => {
                console.error("❌ Consumer connection error:", err?.message || err);
            });

            this.#ch = await this.#conn.createChannel();
            await this.#ch.assertQueue(this.queue, { durable: true });
            await this.#ch.prefetch(this.prefetch);

            console.log(`✅ Consumer ready (queue=${this.queue}, prefetch=${this.prefetch})`);
            return true;
        } catch (e) {
            console.error("❌ Consumer connect failed:", e?.message || e);
            this.#conn = null;
            this.#ch = null;
            return false;
        }
    }

    async start(onMessage) {
        if (this.#running) return;
        this.#running = true;

        const loop = async () => {
            while (this.#running) {
                if (!this.connected) {
                    await this.connect();
                    if (!this.connected) {
                        await this.#sleep(5000);
                        continue;
                    }
                }

                try {
                    await this.#ch.consume(
                        this.queue,
                        async (msg) => {
                            if (!msg) return;

                            let data;
                            try {
                                data = JSON.parse(msg.content.toString("utf8"));
                            } catch (e) {
                                console.error("❌ Invalid JSON:", msg.content.toString());
                                this.#ch.ack(msg); // discard bad message
                                return;
                            }

                            try {
                                await onMessage(data, msg);
                                this.#ch.ack(msg);
                            } catch (e) {
                                console.error("⚠️ Handler failed:", e?.message || e);

                                // requeue = true (retry later)
                                this.#ch.nack(msg, false, true);
                            }
                        },
                        { noAck: false }
                    );

                    // Block here until channel closes
                    await new Promise((resolve) =>
                        this.#conn.once("close", resolve)
                    );
                } catch (e) {
                    console.error("⚠️ Consume loop error:", e?.message || e);
                }

                await this.#sleep(5000);
            }
        };

        loop();
    }

    async stop() {
        this.#running = false;
        try {
            if (this.#ch) await this.#ch.close();
            if (this.#conn) await this.#conn.close();
        } catch {}
    }

    #sleep(ms) {
        return new Promise((r) => setTimeout(r, ms));
    }
}

async function run() {

    const consumer = new RabbitMQConsumer();

    consumer.configure({
        queue: "prematch_855bet",
        prefetch: 1, // 👈 one OCR job at a time
    });

    await consumer.start(async (data) => {
        console.log("📥 Received:", JSON.stringify(data));
    });

}
run().catch((err) => console.error("Error:", err));
