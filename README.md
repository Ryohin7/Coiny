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

## 📁 專案結構

- `src/app`: Next.js 頁面與 API 路由
  - `api/webhook/line`: LINE Bot Webhook 處理中心
  - `trade`: 主要記帳管理介面
- `src/lib/services`: 核心業務邏輯
  - `classifier.ts`: 智能分類引擎
  - `mof-parser.ts`: 電子發票解析與對帳邏輯
- `src/components`: 可複用 React 組件
- `src/lib/firebase`: Firebase 配置與管理工具

## 📄 授權

本專案採用 MIT 授權。
