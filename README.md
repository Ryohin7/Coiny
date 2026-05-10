# Coiny - 你的專屬智能記帳管家

Coiny 是一款結合 LINE Bot、財政部電子發票載具匯入與 AI 自動分類的智能記帳 Web App。旨在提供用戶最無縫、最直覺的財務管理體驗。

## 🌟 核心功能

- **LINE 隨手記帳**：直接透過 LINE 聊天室傳送文字（如：`100 午餐`），系統自動識別日期、分類、金額與備註。
- **電子發票自動對帳**：支援財政部電子發票 CSV 匯入，自動匹配手動記錄，減少漏記與重複記錄。
- **AI 智能分類引擎**：內建強大的分類庫與商店統編識別，並支援用戶自定義關鍵字，讓每筆消費精確歸類。
- **精緻視覺化介面**：採用現代感設計，支援深色模式，提供清晰的收支概覽與詳細明細。
- **LIFF 整合**：完美整合 LINE 內部瀏覽器（LIFF），提供如原生 App 般的流暢體驗。

## 📱 LINE 記帳指令

您可以直接在 LINE 聊天室透過以下格式快速記帳，系統會自動識別金額與分類：

### 基本格式
*   **分類在前**：`晚餐 150`
*   **金額在前**：`150 晚餐`
*   **帶有備註**：`晚餐 150 麥當勞` (空格後即為備註)

### 進階用法
*   **指定日期**：`5/8 晚餐 150` (補記過去的帳)
*   **收入記錄**：`薪資 50000` (自動識別關鍵字：收入、薪資、獎金、利息、中獎、投資)

## 🛠️ 技術棧

- **Frontend**: Next.js 15 (App Router), React, Tailwind CSS, Framer Motion, Lucide React
- **Backend**: Next.js API Routes, Firebase Admin SDK
- **Database/Auth**: Firebase Firestore, Firebase Auth / LIFF
- **Integrations**: LINE Messaging API, LINE LIFF SDK, g0v 公司資料 API

## 🚀 快速開始

### 環境變數設定

在根目錄創建 `.env.local` 並填入以下資訊：

```env
# LINE Configuration
LINE_CHANNEL_ACCESS_TOKEN=your_token
LINE_CHANNEL_SECRET=your_secret
NEXT_PUBLIC_LIFF_ID=your_liff_id

# Firebase Admin Configuration
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_client_email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
```

### 安裝與啟動

```bash
npm install
npm run dev
```

## 📁 功能與文件映射 (Feature to File Mapping)

為了方便開發與 AI 維護，以下列出核心功能與其對應的程式碼路徑：

### 🤖 LINE Bot 相關
- **LINE 訊息處理中心**: `src/app/api/webhook/line/route.ts` (處理記帳指令、回覆訊息)
- **LIFF 登入與環境**: `src/components/providers/LiffProvider.tsx` (處理 LINE 登入、同步用戶資料)
- **用戶資料同步 API**: `src/app/api/user/sync/route.ts` (同步頭像、名稱、權限狀態)

### 📧 電子發票 (載具) 相關
- **Email Webhook 接收端**: `src/app/api/webhook/email/route.ts` (接收轉寄的財政部 CSV 電子郵件)
- **CSV 解析與對帳服務**: `src/lib/services/mof-parser.ts` (解析 CSV 格式、執行模糊對帳邏輯)
- **待確認發票 API**: `src/app/api/invoices/pending/route.ts` (前端顯示對帳按鈕的資料來源)
- **確認匯入 API**: `src/app/api/invoices/confirm/route.ts` (使用者點擊匯入後的寫入邏輯)

- **商店與分類識別**: `src/lib/services/classifier.ts` (統編識別、關鍵字分類匹配)

### 💻 介面與資料管理
- **主要交易頁面 (Trade)**: `src/app/trade/page.tsx` (顯示收支明細、對帳通知)
- **交易清單組件**: `src/components/trade/TransactionList.tsx`
- **手動支出 API**: `src/app/api/expenses/route.ts` (CRUD 交易記錄)
- **分類管理頁面**: `src/app/settings/categories/page.tsx` (自定義分類與關鍵字)
- **分類 API**: `src/app/api/categories/route.ts`

---

## 📄 授權

本專案採用 MIT 授權。
