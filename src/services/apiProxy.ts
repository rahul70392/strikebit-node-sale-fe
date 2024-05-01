import {NextApiRequest, NextApiResponse} from "next";
import httpProxyMiddleware, {NextHttpProxyMiddlewareOptions} from "next-http-proxy-middleware";
import {HttpStatusCode} from "axios";

const baseConfig = {
  api: {
    externalResolver: true,
  }
}

const GatewayTimeoutErrorCodes = [
  "ECONNREFUSED",
  "ETIMEDOUT",
  "ECONNRESET",
]

const handleProxyInit: NextHttpProxyMiddlewareOptions["onProxyInit"] = (proxy) => {
  proxy.on("proxyReq", (proxyReq, req, res) => {
    /*const accessToken = (req as any).cookies[ACCESS_TOKEN_COOKIE];
    if (accessToken) {
      proxyReq.setHeader('Authorization', `Bearer ${accessToken}`)
    }*/
  });

  proxy.on("error", (err, req, res) => {
    const errCode = (err as any).code;
    
    let statusCode: HttpStatusCode;
    switch (errCode) {
      case "ECONNREFUSED":
      case "ECONNRESET":
      case "ETIMEDOUT":
        statusCode = HttpStatusCode.GatewayTimeout;
        break;
      default:
        statusCode = HttpStatusCode.BadGateway;
        break;
    }

    if (statusCode) {
      res.writeHead(statusCode, []);
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