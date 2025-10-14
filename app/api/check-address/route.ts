import { NextResponse } from "next/server";
import { z } from "zod";
import { fetchAddressSecurity, GoPlusError } from "@/lib/services/goplus";

const ADDRESS_PATTERNS: Array<{ label: string; regex: RegExp }> = [
  { label: "EVM", regex: /^0x[a-fA-F0-9]{40}$/i },
  { label: "Bitcoin bech32", regex: /^(bc1|tb1|bcrt1)[0-9a-z]{11,71}$/ },
  { label: "Bitcoin legacy", regex: /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/ },
  { label: "Bitcoin cash", regex: /^(q|p)[a-z0-9]{41}$/ },
  { label: "Litecoin bech32", regex: /^(ltc1)[0-9a-z]{11,71}$/ },
  { label: "Litecoin legacy", regex: /^[LM3][a-km-zA-HJ-NP-Z1-9]{25,34}$/ },
  { label: "Tron", regex: /^T[1-9A-HJ-NP-Za-km-z]{33}$/ },
  { label: "Solana", regex: /^[1-9A-HJ-NP-Za-km-z]{32,44}$/ },
  { label: "Dogecoin", regex: /^D{1}[5-9A-HJ-NP-U]{1}[1-9A-HJ-NP-Za-km-z]{32}$/ },
  { label: "Bech32 generic", regex: /^[a-z0-9]{1,83}1[ac-hj-np-z02-9]{6,}$/ }
];

const requestSchema = z.object({
  address: z
    .string()
    .min(1, "請輸入錢包地址")
    .max(256, "地址長度過長")
    .refine(
      (value) =>
        ADDRESS_PATTERNS.some((pattern) => pattern.regex.test(value.trim())),
      "地址格式錯誤或尚未支援的鏈別"
    )
});

export async function POST(request: Request) {
  let parsedBody: z.infer<typeof requestSchema>;

  try {
    const body = await request.json();
    const parsed = requestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: parsed.error.errors[0]?.message ?? "無效的請求參數"
        },
        { status: 400 }
      );
    }
    parsedBody = parsed.data;
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "請求解析失敗，請確認資料格式。"
      },
      { status: 400 }
    );
  }

  try {
    const goPlusResult = await fetchAddressSecurity({
      address: parsedBody.address.trim()
    });

    return NextResponse.json(goPlusResult, { status: 200 });
  } catch (error) {
    if (error instanceof GoPlusError) {
      return NextResponse.json(
        error.payload ?? { code: error.status, message: error.message },
        { status: error.status }
      );
    }

    return NextResponse.json(
      {
        code: 500,
        message: "系統發生錯誤，請稍後再試。"
      },
      { status: 500 }
    );
  }
}
