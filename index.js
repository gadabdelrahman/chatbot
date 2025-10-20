import express from "express";
import axios from "axios";
import dotenv from "dotenv";
import cors from "cors";
import OpenAI from "openai";

dotenv.config();
const app = express();

// serve static files placed in /public
app.use(express.static('public'));

app.use(cors());
app.use(express.json());


const PORT = process.env.PORT || 3000;

const SHOPIFY_STORE_URL = process.env.SHOPIFY_STORE_URL;
const SHOPIFY_API_TOKEN = process.env.SHOPIFY_API_TOKEN;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

console.log("✅ Shopify Store URL:", SHOPIFY_STORE_URL);

// -----------------------------
// 🔹 Helper for Shopify requests
// -----------------------------
async function shopifyGet(endpoint) {
  try {
    const res = await axios.get(`${SHOPIFY_STORE_URL}/admin/api/2023-10/${endpoint}`, {
      headers: {
        "X-Shopify-Access-Token": SHOPIFY_API_TOKEN,
        "Content-Type": "application/json",
      },
    });
    return res.data;
  } catch (err) {
    console.error("❌ Shopify API error:", err.response?.data || err.message);
    throw err;
  }
}

// -----------------------------
// 🔹 Fetch Products
// -----------------------------
app.get("/products", async (req, res) => {
  try {
    const data = await shopifyGet("products.json");
    res.json(data);
  } catch {
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

// -----------------------------
// 🔹 Fetch Order by Number (works for fulfilled too)
// -----------------------------
app.get("/orders/:orderId", async (req, res) => {
  const { orderId } = req.params;
  console.log(`🔍 Searching for order ${orderId}...`);

  try {
    // Fetch a wide range of orders (fulfilled, unfulfilled, etc.)
    const data = await shopifyGet("orders.json?status=any&limit=250");
    const orders = data.orders || [];

    // Match by both “#1001” and “1001”
    const order = orders.find(
      (o) => o.name === `#${orderId}` || o.name === orderId
    );

    if (!order) {
      return res.json({ message: `No order found with ID ${orderId}` });
    }

    // Extract key info
    const fulfillment = order.fulfillments?.[0];
    const shipping = order.shipping_address;

    res.json({
      id: order.id,
      name: order.name,
      email: order.email,
      total_price: `${order.total_price} ${order.currency}`,
      financial_status: order.financial_status,
      fulfillment_status: order.fulfillment_status || "Unfulfilled",
      created_at: order.created_at,
      shipping_address: shipping
        ? `${shipping.first_name} ${shipping.last_name}, ${shipping.address1}, ${shipping.city}`
        : "No shipping address found",
      tracking: fulfillment?.tracking_url || "No tracking link yet",
      tracking_number: fulfillment?.tracking_number || "No tracking number yet",
      line_items: order.line_items.map((item) => ({
        title: item.title,
        quantity: item.quantity,
        price: `${item.price} ${order.currency}`,
      })),
    });
  } catch (error) {
    console.error("❌ Error fetching order:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to fetch order details" });
  }
});

// -----------------------------
// 🔹 Chatbot Route (OpenAI + Shopify Integration)
// -----------------------------
app.post("/chat", async (req, res) => {
  const { message } = req.body;

  try {
    let context = "";

    // 🛍 Product inquiries
    if (/product|price|item|catalog/i.test(message)) {
      const data = await shopifyGet("products.json");
      const productList =
        data.products
          ?.map(
            (p) =>
              `${p.title} (Price: ${p.variants[0].price} ${
                p.variants[0].currency || "EGP"
              })`
          )
          .join(", ") || "No products available right now.";
      context = `Available products: ${productList}`;
    }

    // 📦 Order or shipping inquiries
    else if (/order|track|status|shipping|delivery/i.test(message)) {
      context = `
The user is asking about their order or shipping status.
Ask politely for their order number (like #1001) first.
Once they provide it, the frontend will call /orders/:orderId to show details.
Do not make up data — just guide them clearly.
      `;
    }

    // 🧠 Generate OpenAI response
    const aiRes = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `
You are a friendly Shopify assistant.
- Use only real Shopify data provided in context.
- Be polite, short, and accurate.
- If user asks about orders or shipping, request the order number.
- Never invent product or tracking details.
          `,
        },
        { role: "user", content: context || message },
      ],
      max_tokens: 150,
    });

    res.json({ reply: aiRes.choices[0].message.content });
  } catch (error) {
    console.error("❌ Chatbot error:", error.message);
    res.json({ reply: "⚠️ Sorry, I couldn’t process that request right now." });
  }
});

// -----------------------------
// 🔹 Start the Server
// -----------------------------

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
