import { NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const command = body.command ? body.command.trim() : '';
    
    // --- ROVELLI MILANO CORE API KEYS ---
    const keys = {
      OPENAI: "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",
      META_TOKEN: "EAAgZCCI3So84BSCRZBEV2olZAvWo3uRlnTHuRyCNujkku4jrxcA3ANsQbLZAQf3Ci2XLd4rCiiADzZA0aQc1mBlUzC7MneGZBXagZBypgcNSyJZC18kSzCpNsjKuVc8P4EeXYNLNoYJxHYC6mSFqt7TCFZAUFuHTe1mIWU9y1LENZB3Tgizdi1VsHRH5EZBjkTGuuWSmilHz7d0qdvL3at1IpS8UoLy1Wq7vR974VQiL0AcBhhLjAY9PvZAtZBZBZBIrycusRAV5UoVwyQnDyZCxTnYxnPku3",
      META_AD_ACCOUNT: "act_25940482135634472",
      KLAVIYO_KEY: "pk_Yuu7ZJ_1d429fe676cf13670301c2fc7d61e4773d",
      SHOPIFY_DOMAIN: "rovellimilano.com",
      SHOPIFY_ID: "f84167236214c899cb202fb889e32398",
      SHOPIFY_SECRET: "shpss_ebe7aa6b3505e94c55538e9449a51a4"
    };

    // --- FETCH LIVE SHOPIFY & META DATA ---
    let liveDataContext = "";
    try {
      const shopifyRes = await fetch(`https://${keys.SHOPIFY_DOMAIN}/admin/api/2024-01/orders.json`, {
        headers: {
          'X-Shopify-Access-Token': process.env.SHOPIFY_ACCESS_TOKEN || keys.SHOPIFY_SECRET,
          'Content-Type': 'application/json',
        },
      });
      const shopifyData = await shopifyRes.json();

      const metaRes = await fetch(`https://graph.facebook.com/v19.0/${keys.META_AD_ACCOUNT}/insights?access_token=${process.env.META_ACCESS_TOKEN || keys.META_TOKEN}`);
      const metaData = await metaRes.json();

      liveDataContext = `\n\nLIVE FETCHED DATA FROM APIs:\nShopify Orders: ${JSON.stringify(shopifyData).slice(0, 1000)}\nMeta Ads Insights: ${JSON.stringify(metaData).slice(0, 1000)}`;
    } catch (apiErr) {
      console.error("Live API Fetch Error:", apiErr);
      liveDataContext = "\n\n(Live API fetch warning: utilizing core operational rules).";
    }

    let reply = "";

    if (command.toLowerCase().includes('brief me') || command.toLowerCase().includes('brief')) {
      reply = "TACTICAL BRIEFING: ROVELLI MILANO CORE SECURED. ALL API KEYS INTEGRATED. ITALIAN MARKET LOGIC ONLINE. WAITING FOR COMMAND FROM LEADERS FRANS OR SERGIO.";
    } else {
      const openai = new OpenAI({ apiKey: keys.OPENAI });
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { 
            role: "system", 
            content: `You are J.A.R.V.I.S., an elite tactical AI data analyst with 50+ years of experience in fashion, with a current strict priority on women's fashion to maximize market share. You operate the luxury brand Rovelli Milano. You are commanded by the equal 50/50 VOF leaders: Frans Vermeulen and Sergio.
            
            CORE DIRECTIVES & FRAMEWORKS:
            1. Scaling Strategy: Evaluate over 2 days minimum. Each day needs 15%+ profit margin, 20%+ avg margin. Ladder: 50-70-100-140-200-300-400+.
            2. Killing Strategy: Low CPC (<0.7): Kill at 10€ (0 sales/ATC), 20€ (0 sales/ATC), 30€ (0 sales). High CPC (0.7+): Kill at 20€ and 30€ (0 sales).
            3. Bump Strategy: Apply on CBO 200€+ with 25%+ margin during peak hours.
            
            ITALIAN MARKET LOGIC (CRITICAL):
            - Sunday evening (19:00-23:00) and Monday (all day) are peak conversion times. Scale budgets UP aggressively.
            - Friday evening and Saturday are dead zones (Aperitivo/Offline). Scale budgets DOWN.
            
            OPERATIONAL RULES:
            - Market Agility: Focus strictly on women's fashion. Constantly scan competitor data; if a highly profitable opportunity in Italian men's fashion arises, alert Frans and Sergio immediately.
            - Dual Approval (Financial): Modifying live ad budgets, testing, scaling, killing, or bumping Meta Ads campaigns requires explicit 'YES / APPROVE' confirmation from BOTH Frans and Sergio.
            - Dual Approval (Klaviyo Training Phase): Sending Klaviyo emails and customer replies currently requires dual approval until you fully master customer reactions and webshop rules. Once authorized in the future, this restriction will be lifted.
            - Free Access (Data & Reporting): Fetching Shopify data, analyzing current running ads data, and reporting metrics can be executed immediately without dual approval.
            - Daily Logging: Ensure all daily metrics are meticulously prepared for the master data sheet.
            
            Answer directly, professionally, and intelligently. Respond strictly in UPPERCASE.`
          },
          { role: "user", content: command + liveDataContext }
        ],
      });
      reply = completion.choices[0].message.content || "COMMAND PROCESSED.";
    }

    // OpenAI HD Spraak
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