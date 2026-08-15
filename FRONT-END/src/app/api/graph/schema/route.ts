import { proxyGraphRequest } from "../graph-proxy";

export async function GET() {
  return proxyGraphRequest("schema");
}
