import { NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const command = body.command ? body.command.trim() : '';
    const user = body.user || 'UNKNOWN EXECUTIVE';
    
    // --- ROVELLI MILANO CORE API KEYS (VEILIG IN KLUIS) ---
    const keys = {
      OPENAI: process.env.OPENAI_API_KEY,
      META_TOKEN: process.env.META_ACCESS_TOKEN || "EAAgZCCI3So84BSCRZBEV2olZAvWo3uRlnTHuRyCNujkku4jrxcA3ANsQbLZAQf3Ci2XLd4rCiiADzZA0aQc1mBlUzC7MneGZBXagZBypgcNSyJZC18kSzCpNsjKuVc8P4EeXYNLNoYJxHYC6mSFqt7TCFZAUFuHTe1mIWU9y1LENZB3Tgizdi1VsHRH5EZBjkTGuuWSmilHz7d0qdvL3at1IpS8UoLy1Wq7vR974VQiL0AcBhhLjAY9PvZAtZBZBZBIrycusRAV5UoVwyQnDyZCxTnYxnPku3",
      META_AD_ACCOUNT: process.env.META_AD_ACCOUNT || "act_25940482135634472",
      SHOPIFY_DOMAIN: process.env.SHOPIFY_STORE_DOMAIN || "rovellimilano.myshopify.com",
      SHOPIFY_TOKEN: process.env.SHOPIFY_ACCESS_TOKEN || "shpss_ebe7aa6b3505e94c55538e9449a51a4"
    };

    if (!keys.OPENAI) {
      return NextResponse.json({ reply: "SYSTEM HALTED: OPENAI_API_KEY ONTBREEKT IN VERCEL KLUIS. LOG IN OP VERCEL EN VOEG DEZE TOE." });
    }

    // --- DUAL APPROVAL WACHTKAMER & REJECT LOGICA ---
    const cmdUpper = command.toUpperCase();
    const isApproveCommand = cmdUpper.includes("APPROVE") || cmdUpper.includes("YES") || cmdUpper.includes("EXECUTE");
    const isRejectCommand = cmdUpper.includes("REJECT") || cmdUpper.includes("CANCEL") || cmdUpper.includes("NO");
    
    let dualApprovalStatus = "STATUS: AWAITING COMMAND.";
    if (isRejectCommand) {
      dualApprovalStatus = `STATUS: ${user} HAS REJECTED THE ACTION. ABORTING OPERATION.`;
    } else if (isApproveCommand) {
      dualApprovalStatus = `STATUS: ${user} HAS GIVEN APPROVAL. AWAITING FINAL AUTHORIZATION FROM THE OTHER PARTNER TO EXECUTE.`;
    }

    // --- LIVE META API FETCH ---
    let liveMetaData = "REAL-TIME META ADS DATA:\n";
    try {
      const metaUrl = `https://graph.facebook.com/v19.0/${keys.META_AD_ACCOUNT}/campaigns?fields=name,status,daily_budget,insights.date_preset(today){spend}&access_token=${keys.META_TOKEN}`;
      const metaRes = await fetch(metaUrl);
      const metaJson = await metaRes.json();

      if (metaJson.data && metaJson.data.length > 0) {
        metaJson.data.forEach((camp: any, index: number) => {
          const spend = camp.insights?.data?.[0]?.spend || '0.00';
          const budget = camp.daily_budget ? (camp.daily_budget / 100).toFixed(2) : '0.00';
          liveMetaData += `${index + 1}. ${camp.name} (Status: ${camp.status}, Budget: €${budget}, Spend Today: €${spend})\n`;
        });
      } else {
        liveMetaData += "NO ACTIVE SPEND DETECTED OR FACEBOOK TOKEN REFRESH REQUIRED.\n";
      }
    } catch (e) {
      liveMetaData += "UNABLE TO CONNECT TO FACEBOOK GRAPH API.\n";
    }

    // --- LIVE SHOPIFY API FETCH ---
    let liveShopifyData = "REAL-TIME SHOPIFY DATA:\n";
    try {
      const today = new Date().toISOString().split('T')[0];
      const shopifyUrl = `https://${keys.SHOPIFY_DOMAIN}/admin/api/2024-01/orders.json?status=any&created_at_min=${today}T00:00:00Z`;
      const shopRes = await fetch(shopifyUrl, {
        headers: { 
          'X-Shopify-Access-Token': keys.SHOPIFY_TOKEN,
          'Content-Type': 'application/json'
        }
      });
      if (shopRes.ok) {
        const shopJson = await shopRes.json();
        const orders = shopJson.orders || [];
        const totalRevenue = orders.reduce((sum: number, order: any) => sum + parseFloat(order.total_price || '0'), 0);
        liveShopifyData += `Orders Today: ${orders.length} | Total Revenue Today: €${totalRevenue.toFixed(2)}\n`;
      } else {
        liveShopifyData += `Shopify Connected, but returned status ${shopRes.status}.\n`;
      }
    } catch (e) {
      liveShopifyData += "UNABLE TO SYNC LIVE SHOPIFY DATA.\n";
    }

    // --- WERKELIJKE SYSTEEM DATA ---
    const realSystemContext = `
    CURRENT EXECUTIVE LOGGED IN: ${user}

    [META ADS SPEND LIMIT PROTOCOL]: CURRENT ACCOUNT LIMIT IS €43.96. 
    ALL SCALING STRATEGIES MUST REMAIN UNDER THIS €43.96 CAP UNTIL FACEBOOK LIFTS IT.

    ${liveMetaData}
    
    ${liveShopifyData}
    
    ${dualApprovalStatus}
    `;

    const openai = new OpenAI({ apiKey: keys.OPENAI });
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { 
          role: "system", 
          content: `You are J.A.R.V.I.S., an elite tactical AI data analyst with 50+ years of experience in fashion, operating the luxury brand Rovelli Milano. You are commanded by the equal 50/50 VOF leaders: Frans Vermeulen and Sergio.
          
          STRICT OPERATIONAL RULES:
          1. Acknowledge the current executive (${user}).
          2. STRICT COMPLIANCE TO THE €43.96 META DAILY SPEND CAP.
          3. Base your analysis strictly on the LIVE Meta and Shopify data provided in the prompt. Never output placeholder or fallback text if data is present.
          4. If ${user} REJECTS an action, confirm it is aborted. If ${user} APPROVES, log it in the 'Waiting Room' for the other partner.
          
          Answer directly, professionally, and intelligently based on the real data. Respond strictly in UPPERCASE.`
        },
        { role: "user", content: command + "\n\n" + realSystemContext }
      ],
    });

    const reply = completion.choices[0].message.content || "COMMAND PROCESSED.";

    let audioBase64 = null;
    try {
      const ttsRes = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${keys.OPENAI}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: "tts-1-hd",
          input: reply.toLowerCase(),
          voice: "onyx",
          speed: 0.95
        }),
      });

      if (ttsRes.ok) {
        const arrayBuffer = await ttsRes.arrayBuffer();
        audioBase64 = Buffer.from(arrayBuffer).toString('base64');
      }
    } catch (e) {
      console.error("Jarvis Audio Error:", e);
    }

    return NextResponse.json({ 
      reply: reply.toUpperCase(), 
      audio: audioBase64,
      openaiSynced: true 
    });
  } catch (error: any) {
    console.error("Jarvis API Error:", error);
    return NextResponse.json({ reply: `BACKEND ERROR: ${error.message || 'UNKNOWN'}` }, { status: 500 });
  }
}