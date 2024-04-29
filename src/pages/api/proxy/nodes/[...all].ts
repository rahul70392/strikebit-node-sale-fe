import apiProxy from "@/services/apiProxy";

export const config = {
  api: {
    externalResolver: true,
  }
}
export default apiProxy.createHandler(process.env.DROPLET_NODES_API_BASE_URL!, "^/api/proxy/nodes")