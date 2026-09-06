import { NextRequest, NextResponse } from "next/server";

// ElevenLabs Standard Voice ID for "Grace" (Calm, warm, gentle, reassuring conversational female)
const DEFAULT_GRACE_VOICE_ID = "oWAx60SgOHbt37ZaSlIh";

export async function GET() {
  const hasKey = Boolean(process.env.ELEVENLABS_API_KEY && process.env.ELEVENLABS_API_KEY.trim());
  return NextResponse.json({
    configured: hasKey,
    voice: "Grace",
    voiceId: process.env.ELEVENLABS_VOICE_ID || DEFAULT_GRACE_VOICE_ID,
    provider: hasKey ? "elevenlabs" : "browser_grace_neural",
  });
}

export async function POST(req: NextRequest) {
  try {
    const { text, voiceId } = await req.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Text parameter is required" }, { status: 400 });
    }

    const apiKey = process.env.ELEVENLABS_API_KEY?.trim();
    if (!apiKey) {
      // Return 200 with available: false so client can instantly use local Grace synthesis without delay
      return NextResponse.json({
        available: false,
        fallback: "browser_grace_neural",
        message: "No ELEVENLABS_API_KEY configured. Falling back to local Grace persona synthesis.",
      });
    }

    const selectedVoiceId = voiceId || process.env.ELEVENLABS_VOICE_ID || DEFAULT_GRACE_VOICE_ID;

    // ElevenLabs Multilingual v2 supports English, Hindi, and 29+ languages with Grace's warm persona
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${selectedVoiceId}?output_format=mp3_44100_128`,
      {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
          Accept: "audio/mpeg",
        },
        body: JSON.stringify({
          text: text.slice(0, 2500), // Safety limit per utterance
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability: 0.55,
            similarity_boost: 0.85,
            style: 0.25,
            use_speaker_boost: true,
          },
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.warn("[ElevenLabs TTS] API error:", response.status, errText);
      return NextResponse.json(
        {
          available: false,
          fallback: "browser_grace_neural",
          error: `ElevenLabs returned ${response.status}`,
        },
        { status: 200 }
      );
    }

    const audioBuffer = await response.arrayBuffer();

    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=43200",
      },
    });
  } catch (err: any) {
    console.error("[TTS Route] Unexpected error:", err);
    return NextResponse.json(
      {
        available: false,
        fallback: "browser_grace_neural",
        error: err?.message || "Internal server error",
      },
      { status: 200 }
    );
  }
}
