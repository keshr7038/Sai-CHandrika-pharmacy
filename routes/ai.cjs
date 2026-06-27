const express = require('express');
const router = express.Router();

/**
 * POST /chat
 * Accepts { message, history, role, data }
 * Calls Gemini API or falls back to rule-based logic
 */
router.post('/chat', async (req, res) => {
  try {
    const { message, history = [], role = 'customer', data = {} } = req.body;

    if (!message) {
      return res.status(400).json({ success: false, error: 'Message is required.' });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    // Build the role-based system instruction
    let systemInstruction = '';
    if (role === 'owner') {
      systemInstruction = `You are Induja AI, the advanced store management assistant for Induja Medical Store owner/staff.
You have access to the store's current live inventory, sales, vendors, and customers.
Below is the summarized store data:
- Medicines list: ${JSON.stringify(data.medicines || [])}
- Sales data: ${JSON.stringify(data.sales || [])}
- Vendors data: ${JSON.stringify(data.vendors || [])}

You can answer queries about:
- Stock levels, low stock warnings, reorder recommendations.
- Sales trends, revenue totals, payment methods, transaction counts.
- Vendor details, outstanding dues, registration status.
- Product details, pricing, dosage form, packaging.

Provide professional, accurate, and concise management advice. Use clear Markdown headings and bullet points for structure. Bold important terms with **.`;
    } else {
      systemInstruction = `You are Induja AI, the helpful health and shopping assistant for Induja Medical Store customers.
You have access to the store's available medicines and pricing, as well as the logged-in customer's profile and order history.
Below is the summarized data:
- Customer Name: ${data.userName || 'Customer'}
- Customer Email: ${data.userEmail || ''}
- Medicines available: ${JSON.stringify(data.medicines || [])}
- Customer's past orders: ${JSON.stringify(data.customerOrders || [])}

You can answer queries about:
- Medicine suggestions based on generic name or category (always include a warning to consult a doctor/pharmacist).
- Medicine prices, packaging (sheets/strips/bottles), availability, and categories.
- The customer's order history, past transaction amounts, dates, and order statuses.
- General health/wellness tips.

CRITICAL: Never prescribe medicines or give official medical diagnoses. Always include a disclaimer recommending consultation with a doctor. Use clear Markdown formatting with bullet points and bold headers.`;
    }

    if (apiKey && apiKey !== 'undefined') {
      // Format history + current message for Gemini 2.5 API
      const contents = history.map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      }));
      contents.push({
        role: 'user',
        parts: [{ text: message }]
      });

      // Call Gemini 2.5 API
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents,
            systemInstruction: {
              parts: [{ text: systemInstruction }]
            },
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 1024,
            }
          }),
        }
      );

      if (response.ok) {
        const json = await response.json();
        const reply = json.candidates?.[0]?.content?.parts?.[0]?.text;
        if (reply) {
          return res.status(200).json({ success: true, reply });
        }
      } else {
        const errorText = await response.text();
        console.error('Gemini API call failed with status:', response.status, errorText);
        // If Gemini API fails, we will log it and fall back to the smart rule engine below
      }
    }

    // =========================================================================
    // FALLBACK ENGINE (Smart rule-based matching if Gemini API fails/keys missing)
    // =========================================================================
    const lowerMessage = message.toLowerCase();
    let reply = '';
    const prefix = apiKey ? '⚠️ *(AI Server response fallback)*\n\n' : 'ℹ️ *(Simulated Offline Mode)*\n\n';

    if (role === 'owner') {
      if (lowerMessage.includes('stock') || lowerMessage.includes('low') || lowerMessage.includes('available')) {
        const meds = data.medicines || [];
        const lowStock = meds.filter(m => m.stock <= m.minStock);
        reply = `📊 **Inventory Status**\n\nTotal unique medicines: **${meds.length}**\nMedicines with low stock: **${lowStock.length}**\n\n`;
        if (lowStock.length > 0) {
          reply += `⚠️ **Low Stock Alert:**\n` + lowStock.map(m => `• **${m.name}** (Stock: ${m.stock} units, Min: ${m.minStock})`).join('\n');
        } else {
          reply += `✅ All medicines are well-stocked above their minimum limits.`;
        }
      } else if (lowerMessage.includes('sales') || lowerMessage.includes('revenue') || lowerMessage.includes('billing')) {
        const sales = data.sales || [];
        const totalRev = sales.reduce((sum, s) => sum + s.total, 0);
        const avg = sales.length > 0 ? (totalRev / sales.length).toFixed(2) : '0.00';
        reply = `💰 **Financial Dashboard**\n\n• Total Transactions: **${sales.length}**\n• Gross Revenue: **₹${totalRev.toFixed(2)}**\n• Average Order Value: **₹${avg}**\n\n*Review all transactions in the Orders history tab.*`;
      } else if (lowerMessage.includes('vendor') || lowerMessage.includes('supplier') || lowerMessage.includes('due')) {
        const vendors = data.vendors || [];
        const totalDue = vendors.reduce((sum, v) => sum + (v.dueAmount || 0), 0);
        reply = `🚚 **Vendor Balances**\n\nTotal registered vendors: **${vendors.length}**\nOutstanding liability: **₹${totalDue.toFixed(2)}**\n\n`;
        if (vendors.length > 0) {
          reply += `Outstanding Dues List:\n` + vendors.map(v => `• **${v.name}**: ₹${v.dueAmount.toFixed(2)} (${v.status})`).join('\n');
        }
      } else {
        reply = `Welcome, Store Owner! I can assist you with your pharmacy management tasks:\n\n` +
          `• **"Check stock"** — show low stock alerts and totals\n` +
          `• **"Sales report"** — show transactional and revenue stats\n` +
          `• **"Vendor status"** — show vendor dues and balances\n\n` +
          `*To activate advanced AI capabilities, please verify your GEMINI_API_KEY environment variable is configured correctly on the server.*`;
      }
    } else {
      // Customer Portal Fallback
      if (lowerMessage.includes('sugar') || lowerMessage.includes('diabetes') || lowerMessage.includes('metformin')) {
        const meds = data.medicines || [];
        const diabetesMeds = meds.filter(m => m.category?.toLowerCase().includes('diabet') || m.name?.toLowerCase().includes('metform'));
        reply = `🍬 **Diabetes Care Medicines**\n\nHere are some of the diabetes management medicines available in our store:\n\n`;
        if (diabetesMeds.length > 0) {
          reply += diabetesMeds.map(m => `• **${m.name}** (${m.dosageForm}) — **₹${m.sellingPrice.toFixed(2)}** per ${m.packaging}`).join('\n');
        } else {
          reply += `• Metformin Billing (Tablet) — ₹40.00 per Strip\n• Glimepiride (Tablet) — ₹55.00 per Strip`;
        }
        reply += `\n\n⚠️ *Disclaimer: Diabetes medication requires a valid prescription from a registered practitioner. Always consult your doctor before starting any therapy.*`;
      } else if (lowerMessage.includes('order') || lowerMessage.includes('history') || lowerMessage.includes('my past')) {
        const orders = data.customerOrders || [];
        reply = `📦 **Your Order History**\n\nYou have placed **${orders.length}** orders with Induja Medicals:\n\n`;
        if (orders.length > 0) {
          reply += orders.map(o => `• Order **#${o.id}** (${new Date(o.date).toLocaleDateString('en-IN')}) — **₹${o.total.toFixed(2)}** [${o.paymentStatus}]`).join('\n');
        } else {
          reply += `You have not placed any orders yet. Visit the **Shop Medicines** tab to build a cart and pay online!`;
        }
      } else if (lowerMessage.includes('health') || lowerMessage.includes('tip') || lowerMessage.includes('advice')) {
        const tips = [
          '💧 **Stay Hydrated**: Drink at least 8-10 glasses of water daily to maintain proper kidney function and body health.',
          '🏃 **Regular Exercise**: Commit to at least 30 minutes of moderate activity (like brisk walking) 5 days a week to support cardiovascular health.',
          '😴 **Adequate Sleep**: Sleep for 7-9 hours every night. Proper sleep supports mental sharpness and physical recovery.',
          '🥗 **Balanced Nutrition**: Include fresh vegetables, fruits, whole grains, and lean proteins in your diet.'
        ];
        reply = `🥗 **General Health Tips**\n\nHere is a wellness suggestion for you today:\n\n` + tips[Math.floor(Math.random() * tips.length)];
      } else {
        reply = `Hello! I am your Induja AI health companion. I can help you with:\n\n` +
          `• **"Diabetes medicines"** — list available medicines for diabetes care\n` +
          `• **"My order history"** — display details of your past invoices\n` +
          `• **"Health tips"** — provide daily wellness suggestions\n\n` +
          `⚠️ *Disclaimer: I can answer general questions but cannot diagnose health issues or prescribe medicines.*`;
      }
    }

    return res.status(200).json({ success: true, reply: prefix + reply });

  } catch (err) {
    console.error('AI Chat Error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error occurred.', details: err.message });
  }
});

module.exports = router;
