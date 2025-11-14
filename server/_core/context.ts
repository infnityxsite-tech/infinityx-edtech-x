// server/_core/context.ts

import type { User } from "../db";
import { sdk } from "./sdk";

export type TrpcContext = {
  req: any;
  res: any;
  user: User | null;
};

export async function createContext(opts: { req: any; res: any }): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    // Try normal Manus authentication
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      user = {
        id: "local-admin",
        name: "Local Admin",
        email: "admin@local.dev",
        role: "admin",
      } as unknown as User;
    } else {
      user = null;
    }
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
