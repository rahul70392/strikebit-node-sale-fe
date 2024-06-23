import {
  Configuration as DropletNodesConfiguration,
  NodesApi as DropletNodesApi,
  UsersApi as DropletNodesUsersApi,
} from "../generated/droplet-nodes-api";
import axios, { AxiosInterceptorManager, InternalAxiosRequestConfig } from "axios";

export interface ApiServices {
  distribrainNodesApi: DropletNodesApi,
  distribrainNodesUsersApi: DropletNodesUsersApi,
  setAccessToken: (accessToken: (string | undefined)) => void
}

const isBrowser = typeof window !== "undefined";

const nodesApiBaseUrl = isBrowser ? "/api/proxy/nodes" : process.env.DISTRIBRAIN_NODES_API_BASE_URL!;

export function createApiServices(
  timeout?: number,
  modifyRequest?: (request: AxiosInterceptorManager<InternalAxiosRequestConfig<any>>) => void
): ApiServices {

  const axiosInstance = axios.create({
    withCredentials: true,
  })

  axiosInstance.interceptors.request.use(config => {
    config.timeout = timeout ?? 0;
    return config;
  });

  if (modifyRequest) {
    modifyRequest(axiosInstance.interceptors.request)
  }

  const distribrainNodesConfiguration = new DropletNodesConfiguration({});

  const setAccessToken = (accessToken: string | undefined) => {
    distribrainNodesConfiguration.accessToken = accessToken;
  }

  return {
    distribrainNodesApi: new DropletNodesApi(distribrainNodesConfiguration, nodesApiBaseUrl, axiosInstance),
    distribrainNodesUsersApi: new DropletNodesUsersApi(distribrainNodesConfiguration, nodesApiBaseUrl, axiosInstance),

    setAccessToken
  };
}