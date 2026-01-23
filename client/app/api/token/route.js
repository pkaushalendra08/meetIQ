import { StreamClient } from "@stream-io/node-sdk";
import jwt from "jsonwebtoken";

const apiKey = process.env.STREAM_API_KEY;
const apiSecret = process.env.STREAM_SECRET_KEY;

export async function POST(request) {
  try {
    const { userId } = await request.json();

    if (!apiKey || !apiSecret) {
      return Response.json(
        { error: "Missing API credentials" },
        { status: 500 }
      );
    }

    const serverClient = new StreamClient(apiKey, apiSecret);

    // Create/upsert the user first
    const newUser = {
      id: userId,
      role: "admin",
      name: userId,
    };
    await serverClient.upsertUsers([newUser]);

    // Generate token valid for 24 hours
    // Manually create JWT to handle clock skew by setting iat to 60 seconds in the past
    const now = Math.floor(Date.now() / 1000);
    const iat = now - 60; // 60 seconds in the past to account for clock skew
    const exp = iat + (24 * 60 * 60); // 24 hours from iat
    
    const token = jwt.sign(
      {
        user_id: userId,
        iat: iat,
        exp: exp,
      },
      apiSecret,
      {
        algorithm: "HS256",
      }
    );

    return Response.json({ token });
  } catch (error) {
    console.error("Token generation error:", error);
    return Response.json(
      { error: "Failed to generate token" },
      { status: 500 }
    );
  }
}