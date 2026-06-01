import { useEffect, useState } from "react";

export const QURAN_FONT = "QuranFont";

let fontLoadAttempted = false;
let fontLoaded = false;

export function useQuranFont() {
  const [ready, setReady] = useState(fontLoaded);

  useEffect(() => {
    if (fontLoadAttempted) {
      setReady(fontLoaded);
      return;
    }

    fontLoadAttempted = true;

    try {
      const Font = require("expo-font");
      Font.loadAsync({
        [QURAN_FONT]: require("../../assets/fonts/QPC.ttf"),
      })
        .then(() => {
          fontLoaded = true;
          setReady(true);
        })
        .catch(() => {
          fontLoaded = false;
          setReady(false);
        });
    } catch {
      fontLoaded = false;
      setReady(false);
    }
  }, []);

  return { fontLoaded: ready, fontFamily: QURAN_FONT };
}

/* 
   Font: QPC-Tajweed-TTF.ttf
   Source: King Fahd Complex for the Printing of the Holy Quran
   This is a Tajweed Uthmani script font with colored diacritics support.
   
   Alternative: Use Google Fonts (Noto Naskh Arabic or Amiri)
     1. npx expo install @expo-google-fonts/noto-naskh-arabic
     2. Then update this hook:
        import { NotoNaskhArabic_400Regular } from "@expo-google-fonts/noto-naskh-arabic";
        Font.loadAsync({ [QURAN_FONT]: NotoNaskhArabic_400Regular });
*/
