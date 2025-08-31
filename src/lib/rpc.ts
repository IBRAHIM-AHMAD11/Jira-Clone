import { hc } from "hono/client";
import { APPType } from "@/app/api/[[...route]]/route";


export const client = hc<APPType>(process.env.NEXT_PUBLIC_APP_URL!);