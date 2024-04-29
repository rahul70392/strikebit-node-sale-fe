import {
  AuthApi as DropletAuthApi,
  Configuration as DropletAuthConfiguration,
  UsersApi as DropletUsersApi
} from "../generated/droplet-api";

import {
  NodesApi as DropletNodesApi,
  UsersApi as DropletNodesUsersApi
} from "../generated/droplet-nodes-api";
import axios, {AxiosInterceptorManager, InternalAxiosRequestConfig} from "axios";

export interface ApiServices {
  dropletAuthApi: DropletAuthApi,
  dropletUsersApi: DropletUsersApi,
  dropletNodesApi: DropletNodesApi,
  dropletNodesUsersApi: DropletNodesUsersApi,
  setAccessToken: (accessToken: (string | undefined)) => void
}

const isBrowser = typeof window !== "undefined";

const dropletApiBaseUrl = isBrowser ? "/api/proxy/droplet" : process.env.DROPLET_API_BASE_URL!;
const nodesApiBaseUrl = isBrowser ? "/api/proxy/nodes" : process.env.DROPLET_NODES_API_BASE_URL!;

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

  const dropletAppConfiguration = new DropletAuthConfiguration({});

  const setAccessToken = (accessToken: string | undefined) => {
    dropletAppConfiguration.accessToken = accessToken;
  }

  return {
    dropletAuthApi: new DropletAuthApi(dropletAppConfiguration, dropletApiBaseUrl, axiosInstance),
    dropletUsersApi: new DropletUsersApi(dropletAppConfiguration, dropletApiBaseUrl, axiosInstance),
    dropletNodesApi: new DropletNodesApi(dropletAppConfiguration, nodesApiBaseUrl, axiosInstance),
    dropletNodesUsersApi: new DropletNodesUsersApi(dropletAppConfiguration, nodesApiBaseUrl, axiosInstance),

    setAccessToken
  };
}