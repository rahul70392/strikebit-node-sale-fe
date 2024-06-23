import {create, StoreApi} from 'zustand'

import clientApiServices from "./clientApiServices";
import {devtools} from "zustand/middleware";
import {BackendError, BackendErrorResponse} from "@/services/backend-errors/backend-errors";
import {createDefaultBackendError, handleBackendErrorThrow} from "@/services/backend-errors/backendErrorHandling";
import {LoginDtoLangEnum} from "@/generated/droplet-api";

interface AuthData {
  user: {
    id: string;
    email: string;
    emailVerified: boolean;
    name: string;
    referralCode: string;
  }
  accessToken: string;
  refreshToken: string;
}

const clientSide = typeof window !== "undefined";

export interface IAuthError {
  originalError: any;
  backendErrorResponse?: BackendErrorResponse;
}

export interface IUserState {
  user: AuthData | null;
  isLoggedIn: () => boolean;
  isInitialized: boolean;
  refresh: () => Promise<AuthData | null>;
  initialize: () => Promise<boolean>;
  login: (email: string, password: string) => Promise<AuthData>;
  logout: () => Promise<void>;
  getUserName: () => string | null;

  autoRefreshTimerId: number;
  setupNextAutoRefresh: (authData: AuthData) => void;
}

const LOCAL_STORAGE_KEY = "DistriBrain.AuthData";
const ACCESS_TOKEN_COOKIE = "DistriBrain.AccessToken";

const setCurrentAuthData = (
  set: StoreApi<IUserState>['setState'],
  authData: AuthData | null,
  setLoggedIn: boolean
) => {
  set((state) => ({user: authData,}));

  clientApiServices.setAccessToken(authData?.accessToken!);

  console.log(`Saving authData to localStorage, authData ${authData == null ? "==" : "!="} null`);
  if (authData == null) {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  } else {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(authData))
  }
};

let startPromise: Promise<boolean> | null = null;

const useUserService = create<IUserState>()(devtools((set, get) => ({
  user: null,
  getUserName: () => get().user?.user?.name ?? get().user?.user?.email ?? null,
  isLoggedIn: () => {
    // TODO: Check if refresh token has expired
    return get().user?.accessToken != undefined;
  },
  isInitialized: false,
  autoRefreshTimerId: 0,
  refresh: async () => {
    //console.log("Refreshing auth state");
    return null;
  },
  setupNextAutoRefresh: (authData: AuthData) => {
  },
  initialize: async () => {
    const initializeInner = async function (set: StoreApi<IUserState>['setState']) {
      if (!clientSide) {
        setCurrentAuthData(set, null, true);
        set((state) => ({
          isInitialized: true,
        }));

        return false;
      }

      console.log("Start init auth");
      const authDataString = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (authDataString == null) {
        console.log("No authData in localStorage");
        set((state) => ({
          isInitialized: true,
        }));
        return false;
      }

      let authData: AuthData;
      try {
        authData = JSON.parse(authDataString) as AuthData;
      } catch (error: any) {
        console.error("Failed to parse authData in localStorage", error);
        set((state) => ({
          isInitialized: true,
        }));
        return false;
      }

      setCurrentAuthData(set, authData, false);

      try {
        console.log("Validate auth token");

        // Refresh token API doesn't seem to work as expected,
        // so instead just call a random API and clear up auth data if it fails (assumedly because of 401)
        await clientApiServices.dropletUsersApi.userControllerGetNotificationSettings();
      } catch (error) {
        console.error("Validate auth token failed");
        console.error(error);

        setCurrentAuthData(set, null, false);
      }

      set((state) => ({
        isInitialized: true,
      }));

      console.log("Initial token refresh finished");

      if (authData != null) {
        get().setupNextAutoRefresh(authData);
      }

      return true;
    };

    if (startPromise == null) {
      startPromise = initializeInner(set);
    }

    return startPromise;
  },
  login: async (email: string, password: string) => {
    let response: AuthData;
    try {
      response = (await clientApiServices.dropletAuthApi.authControllerSignIn({
        email: email,
        password: password,
        lang: LoginDtoLangEnum.En
      })).data as AuthData;
    } catch (error: any) {
      handleBackendErrorThrow(
        error,
        {
          401: () => new BackendError("Incorrect password or account doesn't exist. Please check your data and try again."),
        },
        (errorResponse: BackendErrorResponse) => {
          setCurrentAuthData(set, null, false);
          return createDefaultBackendError(errorResponse);
        }
      );
    }

    if (!response.user.emailVerified)
      throw new BackendError("Email not yet confirmed, please check your inbox.");

    const authData = response;
    setCurrentAuthData(set, authData, true);
    get().setupNextAutoRefresh(authData);

    return authData;
  },
  logout: async () => {
    const oldUser = get().user;

    setCurrentAuthData(set, null, true);
    clearTimeout(get().autoRefreshTimerId);

    await clientApiServices.dropletAuthApi.authControllerLogout({
      deviceId: "none"
    }, {
      headers: {
        "Authorization": `Bearer ${oldUser?.accessToken}`
      }
    });
  }
})));

export {useUserService};