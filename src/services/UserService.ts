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

/*const requestRefreshToken = async function (): Promise<AuthData> {
  return (await clientApiServices.dropletAuthApi.authControllerRefreshToken()).data;
};*/

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

const LOCAL_STORAGE_KEY = "DropletNodes.AuthData";
export const ACCESS_TOKEN_COOKIE = "DropletNodes.AccessToken";

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
    console.log("Refreshing auth state");
    return null;

    /*if (get().user == null) {
      clearTimeout(get().autoRefreshTimerId);
      set(state => {
        return {autoRefreshTimerId: 0};
      });

      return null;
    }

    let refreshedAuthData: AuthData | null = null;
    try {
      refreshedAuthData = await requestRefreshToken();
      setCurrentAuthData(set, refreshedAuthData, true);
    } catch (error: any) {
      console.error("Error during auto token refresh", error);

      const allHttpErrorHandler = () => {
        setCurrentAuthData(set, null, true);
      };

      const backendError = handleBackendError(
        error,
        {
          401: () => {
            allHttpErrorHandler();
            return new BackendError("Session timed out, please log in again");
          },
          403: () => {
            allHttpErrorHandler();
            return new BackendError("Session timed out, please log in again");
          },
        },
        () => null,
        () => null
      );

      // Only continue trying on a network error
      if (backendError != null) {
        //toast.error(backendError.message);
        return null;
      }
    }

    refreshedAuthData ??= get().user!;
    return refreshedAuthData;*/
  },
  setupNextAutoRefresh: (authData: AuthData) => {
    /*const accessTokenExpirationTime = new Date(authData.accessTokenExpiresAt!);

    const timeout =
      process && process.env.NODE_ENV === 'development' ?
        60 * 1000 :
        accessTokenExpirationTime.getTime() - Date.now() - 3 * 60 * 1000;

    console.log(`Setting up next token auto refresh in ${timeout / 1000}s`);

    const timerId = Number(setTimeout(async () => {
      const refreshedAuthData = await get().refresh();
      if (refreshedAuthData == null) {
        console.warn("refreshedAuthData == null, stopping auto auth state refresh");
        return null;
      }

      get().setupNextAutoRefresh(refreshedAuthData);
    }, timeout));

    set((state) => {
      return {autoRefreshTimerId: timerId};
    });*/
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

        await clientApiServices.dropletUsersApi.userControllerGetNotificationSettings();
      } catch (error) {
        console.error("Validate auth token failed");
        console.error(error);

        setCurrentAuthData(set, null, false);
      }

      /*try {
        console.log("Initial token refresh");
        authData = await requestRefreshToken();

        setCurrentAuthData(set, authData, true);
      } catch (error: any) {
        console.error("Error during initial token refresh", error);

        set((state) => ({
          isInitialized: true,
        }));

        const backendError = handleBackendError(
          error,
          {},
          () => setCurrentAuthData(set, null, false),
          () => {
            // Do nothing
          }
        );

        if (backendError) {
          console.error("Not a backend error, resetting authData in localStorage", error);
          setCurrentAuthData(set, null, true);
        }
      }*/

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