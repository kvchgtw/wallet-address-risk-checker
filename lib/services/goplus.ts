import type { GoPlusAddressSecurityResponse } from "@/types/goplus";

export class GoPlusError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly payload?: GoPlusAddressSecurityResponse
  ) {
    super(message);
  }
}

function sanitizeAddress(address: string) {
  const trimmed = address.trim();
  if (/^0x/i.test(trimmed)) {
    return trimmed.toLowerCase();
  }
  return trimmed;
}

export async function fetchAddressSecurity({
  address,
  timeoutMs = 2500
}: {
  address: string;
  timeoutMs?: number;
}): Promise<GoPlusAddressSecurityResponse> {
  if (!process.env.GOPLUS_API_KEY) {
    throw new GoPlusError(
      "Missing GoPlus API key. Set GOPLUS_API_KEY in environment variables.",
      500
    );
  }

  const normalized = sanitizeAddress(address);
  const endpoint = `https://api.gopluslabs.io/api/v1/address_security/${normalized}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(endpoint, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "X-API-KEY": process.env.GOPLUS_API_KEY
      },
      signal: controller.signal
    });

    const payload =
      (await response.json()) as GoPlusAddressSecurityResponse;

    if (!response.ok || payload.code !== 0) {
      throw new GoPlusError(
        payload.message ?? "GoPlus API request failed",
        response.status,
        payload
      );
    }

    return payload;
  } catch (error) {
    if (error instanceof GoPlusError) {
      throw error;
    }

    if (error instanceof Error && error.name === "AbortError") {
      throw new GoPlusError("GoPlus API timeout", 504);
    }

    throw new GoPlusError("Unable to reach GoPlus API", 502);
  } finally {
    clearTimeout(timeout);
  }
}
