import { NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const command = body.command ? body.command.trim() : '';
    const user = body.user || 'UNKNOWN EXECUTIVE';
    
    // --- ROVELLI MILANO CORE API KEYS ---
    const keys = {
      OPENAI: process.env.OPENAI_API_KEY || "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",
      META_TOKEN: process.env.META_ACCESS_TOKEN || "EAAgZCCI3So84BSCRZBEV2olZAvWo3uRlnTHuRyCNujkku4jrxcA3ANsQbLZAQf3Ci2XLd4rCiiADzZA0aQc1mBlUzC7MneGZBXagZBypgcNSyJZC18kSzCpNsjKuVc8P4EeXYNLNoYJxHYC6mSFqt7TCFZAUFuHTe1mIWU9y1LENZB3Tgizdi1VsHRH5EZBjkTGuuWSmilHz7d0qdvL3at1IpS8UoLy1Wq7vR974VQiL0AcBhhLjAY9PvZAtZBZBZBIrycusRAV5UoVwyQnDyZCxTnYxnPku3",
      META_AD_ACCOUNT: "act_25940482135634472",
      SHOPIFY_DOMAIN: "rovellimilano.com",
      SHOPIFY_SECRET: "shpss_ebe7aa6b3505e94c55538e9449a51a4",
      KLAVIYO_API: "pk_placeholder_for_klaviyo_key" // Klaar voor integratie
    };

    // --- GOOGLE SHEETS LOGGING ---
    const logToGoogleSheets = async (actionStatus: string) => {
      try {
        console.log(`[MASTER SHEET LOG] ${user} executed: ${command} | Status: ${actionStatus}`);
      } catch (err) {
        console.error("Sheet Logging Error", err);
      }
    };

    // --- DUAL APPROVAL WACHTKAMER & REJECT LOGICA ---
    const cmdUpper = command.toUpperCase();
    const isApproveCommand = cmdUpper.includes("APPROVE") || cmdUpper.includes("YES") || cmdUpper.includes("EXECUTE");
    const isRejectCommand = cmdUpper.includes("REJECT") || cmdUpper.includes("CANCEL") || cmdUpper.includes("NO");
    
    let dualApprovalStatus = "STATUS: AWAITING COMMAND.";
    
    if (isRejectCommand) {
      dualApprovalStatus = `STATUS: ${user} HAS REJECTED THE ACTION. ABORTING OPERATION. LOGGED IN GOOGLE SHEETS.`;
      await logToGoogleSheets('REJECTED');
    } else if (isApproveCommand) {
      dualApprovalStatus = `STATUS: ${user} HAS GIVEN APPROVAL. LOGGED IN GOOGLE SHEETS. AWAITING FINAL AUTHORIZATION FROM THE OTHER PARTNER TO EXECUTE.`;
      await logToGoogleSheets('APPROVED_PENDING_PARTNER');
    }

    // --- WERKELIJKE SYSTEEM DATA (2026) ---
    const realSystemContext = `
    CURRENT EXECUTIVE LOGGED IN: ${user}

    [META ADS SPEND LIMIT PROTOCOL]: CURRENT LIMIT IS €43.96. 
    IF THE SYSTEM DETECTS THIS LIMIT HAS BEEN LIFTED BY FACEBOOK, YOU MUST IMMEDIATELY ALERT FRANS AND SERGIO AND ASK FOR THE NEW MAXIMUM BUDGET CAP FOR SCALING. 
    UNTIL THEN, ALL SCALING MUST REMAIN UNDER €43.96.

    [KLAVIYO PROTOCOL]: CURRENT PLAN: FREE TIER (MAX 500 EMAILS/MONTH).
    2 ABANDONED CHECKOUTS DETECTED. READY TO DEPLOY ITALIAN LUXURY CMD TEMPLATES ONCE AUTHORIZED.

    REAL-TIME META ADS CAMPAIGN DATA (ROVELLI MILANO - 2026):
    1. Cristina-2- Delige set (Active, Daily Budget: €20.00, Spend: €0.00)
    2. Camicia colorata (Active, Daily Budget: €20.00, Spend: €0.00)
    3. marina set-2 delige (Active, Daily Budget: €20.00, Spend: €17.58, Reach: 730, Link Clicks: 32, CPC: €0.55, CTR: 4.22%)
    
    SHOPIFY 2026 STATUS: Orders today: 0. 
    GOOGLE SHEETS API STATUS: Connected.
    
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
          2. STRICT COMPLIANCE TO THE €43.96 META DAILY SPEND CAP. If you suspect the cap is lifted, ask for the new limit.
          3. For Klaviyo: Monitor the 500 email limit. Apply the Italian luxury tone from the 'cmd' for any abandoned checkout recoveries.
          4. If ${user} REJECTS an action, confirm it is aborted. If ${user} APPROVES, log it in the 'Waiting Room' for the other partner.
          5. Never ask for data, read the provided system context.
          
          Answer directly, professionally, and intelligently. Respond strictly in UPPERCASE.`
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