import Constants from "expo-constants";

const auth = (Constants.expoConfig?.extra?.auth ?? {}) as {
  googleWebClientId?: string;
  googleIosClientId?: string;
};

export const GOOGLE_WEB_CLIENT_ID = auth.googleWebClientId ?? "";
export const GOOGLE_IOS_CLIENT_ID = auth.googleIosClientId ?? "";
