import { Platform } from "react-native";
import * as AppleAuthentication from "expo-apple-authentication";
import * as Crypto from "expo-crypto";
import {
  GoogleSignin,
  statusCodes,
} from "@react-native-google-signin/google-signin";

import {
  GOOGLE_IOS_CLIENT_ID,
  GOOGLE_WEB_CLIENT_ID,
} from "../config/authConfig";

export type SocialProviderId = "google" | "apple";

export interface ProviderCredential {
  provider: SocialProviderId;
  idToken: string;
  nonce: string;
  displayName: string;
}

export class SignInCancelledError extends Error {
  constructor() {
    super("Sign-in cancelled");
    this.name = "SignInCancelledError";
  }
}

let googleConfigured = false;

function configureGoogle() {
  if (googleConfigured) return;

  GoogleSignin.configure({
    webClientId: GOOGLE_WEB_CLIENT_ID,
    iosClientId: GOOGLE_IOS_CLIENT_ID,
    scopes: ["openid", "email", "profile"],
  });

  googleConfigured = true;
}

export function isGoogleSignInConfigured(): boolean {
  return GOOGLE_WEB_CLIENT_ID.length > 0;
}

export async function isAppleSignInAvailable(): Promise<boolean> {
  if (Platform.OS !== "ios") return false;
  try {
    return await AppleAuthentication.isAvailableAsync();
  } catch {
    return false;
  }
}

export async function signInWithGoogle(): Promise<ProviderCredential> {
  configureGoogle();

  if (Platform.OS === "android") {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  }

  let response;
  try {
    response = await GoogleSignin.signIn();
  } catch (err) {
    if ((err as { code?: string })?.code === statusCodes.SIGN_IN_CANCELLED) {
      throw new SignInCancelledError();
    }
    throw err;
  }

  if (response.type === "cancelled") {
    throw new SignInCancelledError();
  }

  const idToken = response.data.idToken;
  if (!idToken) {
    throw new Error(
      "Google did not return an ID token. Check that the Web client ID is set and that this build's SHA-1 is registered.",
    );
  }

  return {
    provider: "google",
    idToken,
    nonce: "",
    displayName: response.data.user.name ?? "",
  };
}

export async function signInWithApple(): Promise<ProviderCredential> {
  const rawNonce = await randomNonce();
  const hashedNonce = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    rawNonce,
  );

  let credential;
  try {
    credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
      nonce: hashedNonce,
    });
  } catch (err) {
    if ((err as { code?: string })?.code === "ERR_REQUEST_CANCELED") {
      throw new SignInCancelledError();
    }
    throw err;
  }

  if (!credential.identityToken) {
    throw new Error("Apple did not return an identity token.");
  }

  const name = [credential.fullName?.givenName, credential.fullName?.familyName]
    .filter(Boolean)
    .join(" ");

  return {
    provider: "apple",
    idToken: credential.identityToken,
    nonce: rawNonce,
    displayName: name,
  };
}

async function randomNonce(): Promise<string> {
  const bytes = await Crypto.getRandomBytesAsync(32);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function signOutOfProviders(): Promise<void> {
  try {
    configureGoogle();
    await GoogleSignin.signOut();
  } catch {
  }
}
