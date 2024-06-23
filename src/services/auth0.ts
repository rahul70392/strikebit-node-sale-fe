import { _initAuth, getAccessToken } from "@auth0/nextjs-auth0";
import { clientFactory } from "@auth0/nextjs-auth0/dist/auth0-session";
import { getConfig } from "@auth0/nextjs-auth0/dist/config";
import version from "@auth0/nextjs-auth0/dist/version";
import { NextApiRequest, NextApiResponse } from "next";
import { Session } from "@auth0/nextjs-auth0/src/session";
import { IncomingMessage } from "node:http";
import { ServerResponse } from "http";

export const auth0Instance = _initAuth({
  baseURL: process.env.AUTH0_BASE_URL
});

export const getClient = () => {
  const {baseConfig} = getConfig({
    httpTimeout: 20000,
    enableTelemetry: false,
    baseURL: process.env.AUTH0_BASE_URL
  });

  const getClient = clientFactory(baseConfig, {
    name: "nextjs-auth0",
    version,
  });
  return getClient();
};

export const refreshToken = async (
  req: IncomingMessage | NextApiRequest,
  res: ServerResponse | NextApiResponse
) => {
  let idToken: string = null!;
  const afterRefresh = async (req: NextApiRequest, res: NextApiResponse, session: Session) => {
    auth0Instance.sessionCache.set(req, res, session);
    idToken = session.idToken!;
    return session;
  };

  await getAccessToken(req, res, {
    refresh: true,
    afterRefresh,
  });

  return idToken;
};

export const isIdTokenExpired = (idToken: string) => {
  const payloadBase64 = idToken.split(".")[1];
  const decodedJson = Buffer.from(payloadBase64, "base64").toString();
  const decoded = JSON.parse(decodedJson);
  const exp = decoded.exp;
  const expired = Date.now() >= exp * 1000;
  return expired;
};
