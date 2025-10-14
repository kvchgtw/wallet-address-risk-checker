# Wallet Risk Checker – V0.1 Prototype

一個極簡的 Next.js 原型，聚焦在「輸入錢包地址 → 呼叫 GoPlus Security API → 呈現風險結果」的核心流程，用於 Phase 1 內部驗證。

## 核心能力

- **單頁網頁體驗**：輸入框、查詢按鈕、Loading 狀態與結果展示。
- **API Route 代理**：`POST /api/check-address` 呼叫 GoPlus Address Security API，統一處理成功、格式錯誤與第三方失敗。
- **風險結果呈現**：在前端顯示 GoPlus 回傳的風險提示，便於驗證欄位內容。
- **動態風險提示**：自動解析 GoPlus 的風險因子並以中文提示使用者，若無高風險紀錄也會提供提醒訊息。
- **多鏈地址驗證**：支援 GoPlus API 覆蓋的常見鏈別 (EVM、Bitcoin、Solana、Tron 等) 並提供合理的格式檢查。

## 專案結構

```
.
├── app
│   ├── api
│   │   └── check-address/route.ts      # 核心 API 端點
│   ├── globals.css                     # Tailwind 基底樣式
│   └── page.tsx                        # 單頁式介面
├── lib
│   └── services/goplus.ts             # GoPlus API 代理與錯誤處理
├── types/goplus.ts                     # GoPlus API 型別定義
├── .env.example                        # 環境變數樣板
├── package.json                        # 指令與依賴
└── README.md
```

## 快速開始

1. **安裝依賴**

   ```bash
   npm install
   ```

2. **設定環境變數**  
   複製 `.env.example` 為 `.env.local`，填入：

   - `GOPLUS_API_KEY`：在 GoPlus Security 申請的 API Key。

3. **啟動開發伺服器**

   ```bash
   npm run dev
   ```

   - 網址：`http://localhost:3000`
   - 使用瀏覽器輸入任一 EVM 地址快速驗證流程。

## API 測試

```bash
curl -X POST http://localhost:3000/api/check-address \
  -H "Content-Type: application/json" \
  -d '{"address": "0x00000000219ab540356cbb839cbe05303d7705fa"}'
```

可能回應：
- `200 OK`：帶有 `success: true` 與 GoPlus 風險資訊。
- `400 Bad Request`：地址格式錯誤或缺少參數。
- `500/502/504`：GoPlus API 失敗、無法連線或逾時。

## 後續延伸方向

1. 加入 Prisma / Postgres 以紀錄查詢日誌與行為分析。
2. 建立速率限制與錯誤觀測機制以提升穩定度。
3. 導入 LINE Bot Webhook，擴充多渠道的查詢體驗。
4. 撰寫自動化測試覆蓋 API 與前端互動。
