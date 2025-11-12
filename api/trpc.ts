// api/trpc.ts
import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";

// ضبط المسارات حسب مشروعك: هذا يفترض أن الـ router موجود في server/routers
import { appRouter } from "../server/routers";
import { createContext } from "../server/_core/context";

// تهيئة الــ Express app مرة واحدة (سيُعاد استعماله لكل طلب)
const app = express();
app.use(express.json({ limit: "50mb" }));

// ركب ترويج tRPC على هذا الـ app
app.use(
  "/api/trpc", // داخل هذا الملف، Vercel سيُسند المسار /api/trpc هنا
  // createExpressMiddleware ترجع middleware لـ Express يتعامل مع طلبات tRPC
  // ملاحظة: هنا نضع createContext و appRouter كما في مشروعك
  // تأكد أن المسارات import صحيحة بالنسبة لمكان الملف
  createExpressMiddleware({
    router: appRouter,
    createContext,
  })
);

// هذه الدالة تُحوّل app إلى handler مناسب لـ Vercel
export default function handler(req: any, res: any) {
  // Express app قابل للاستدعاء كـ function(req,res)
  // استدعاء الـ app سيُمرّر الطلب إلى middleware اللي ركبناه أعلاه
  return app(req, res);
}
