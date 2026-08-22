const GOOGLE_WEB_CLIENT_ID = process.env.GOOGLE_WEB_CLIENT_ID ?? "";
const GOOGLE_IOS_CLIENT_ID = process.env.GOOGLE_IOS_CLIENT_ID ?? "";

function iosUrlScheme(clientId) {
  const id = clientId.replace(".apps.googleusercontent.com", "");
  return `com.googleusercontent.apps.${id || "REPLACE-WITH-IOS-CLIENT-ID"}`;
}

if (!GOOGLE_WEB_CLIENT_ID) {
  console.warn(
    "\n⚠️  GOOGLE_WEB_CLIENT_ID is not set — Google sign-in will fail.\n" +
      "   Copy DeenQuestExpo/.env.example to DeenQuestExpo/.env and fill it in.\n",
  );
}

module.exports = ({ config }) => ({
  ...config,
  plugins: [
    ...(config.plugins ?? []),
    [
      "@react-native-google-signin/google-signin",
      { iosUrlScheme: iosUrlScheme(GOOGLE_IOS_CLIENT_ID) },
    ],
  ],
  extra: {
    ...config.extra,
    auth: {
      googleWebClientId: GOOGLE_WEB_CLIENT_ID,
      googleIosClientId: GOOGLE_IOS_CLIENT_ID,
    },
  },
});
