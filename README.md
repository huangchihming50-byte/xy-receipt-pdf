# 翔宇收據 PDF 服務 (xy-receipt-pdf)

自架 HTML→PDF 服務，供 n8n WF15 產生收據 PDF。中文字型內建，資料不經第三方。

## 部署 (Render, 免費)
1. 把本資料夾所有檔案放到一個 GitHub repo。
2. Render → New → Web Service → 連這個 repo。
3. Render 讀到 Dockerfile 會自動用 Docker 建置 (免費方案)。
4. 環境變數 RECEIPT_SECRET 會自動產生 (render.yaml)；到 Render 該服務 Environment 複製它的值。
5. 部署完成得到網址，例如 https://xy-receipt-pdf.onrender.com

## API
POST /pdf
  Header: x-receipt-secret: <RECEIPT_SECRET>
  Body(JSON): { "html": "<完整HTML>", "filename": "receipt.pdf" }
  回傳: application/pdf

GET /healthz -> {"ok":true}
