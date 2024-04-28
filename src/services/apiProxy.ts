import {NextApiRequest, NextApiResponse} from "next";
import httpProxyMiddleware, {NextHttpProxyMiddlewareOptions} from "next-http-proxy-middleware";

const baseConfig = {
  api: {
    externalResolver: true,
  }
}

const handleProxyInit: NextHttpProxyMiddlewareOptions["onProxyInit"] = (proxy) => {
  proxy.on("proxyReq", (proxyReq, req, res) => {
    /*const accessToken = (req as any).cookies[ACCESS_TOKEN_COOKIE];
    if (accessToken) {
      proxyReq.setHeader('Authorization', `Bearer ${accessToken}`)
    }*/
  });

  proxy.on("error", (err, _, res) => {
    const errCode = (err as any).code;
    if (errCode === "ECONNREFUSED" || errCode == "ETIMEDOUT" || errCode == "ECONNRESET") {
      res.writeHead(504, []);
    }
    res.end()
  });
};

const createHandler = (target: string, pattern: string) => {
  return async (
    req: NextApiRequest,
    res: NextApiResponse
  ) => {
    await httpProxyMiddleware(req, res, {
      target: target,
      changeOrigin: true,
      pathRewrite: [{
        patternStr: pattern,
        replaceStr: "/"
      }],
      onProxyInit: handleProxyInit,
    });
  };
}

const apiProxy = {
  createHandler,
  baseConfig: baseConfig
}

export default apiProxy