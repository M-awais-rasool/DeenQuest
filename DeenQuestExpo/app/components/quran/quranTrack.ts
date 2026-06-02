import type { Track } from "react-native-track-player";
import type {
  QuranAyah,
  QuranSurahAudio,
  QuranSurahDetail,
} from "../../store/services/api";

export interface QuranAyahTrack extends Track {
  id: string;
  queueId: string;
  surahId: number;
  ayahNumber: number;
  globalAyahNumber: number;
}

export const getQuranQueueId = (surahId: number) => `quran-surah-${surahId}`;

export const getQuranTrackId = getQuranQueueId;

export const getQuranAyahTrackId = (surahId: number, ayahNumber: number) =>
  `${getQuranQueueId(surahId)}-ayah-${ayahNumber}`;

export const parseQuranAyahTrackId = (trackId?: string | number | null) => {
  if (typeof trackId !== "string") return null;

  const match = /^quran-surah-(\d+)-ayah-(\d+)$/.exec(trackId);
  if (!match) return null;

  return {
    surahId: Number(match[1]),
    ayahNumber: Number(match[2]),
  };
};

export const isQuranQueueTrack = (
  track: Track | undefined,
  queueId: string,
) => {
  if (!track) return false;
  if (track.queueId === queueId) return true;

  const parsed = parseQuranAyahTrackId(track.id);
  return parsed ? getQuranQueueId(parsed.surahId) === queueId : false;
};

export const getAyahNumberFromTrack = (
  track: Track | undefined,
  surahId: number,
) => {
  if (!track) return null;

  if (
    typeof track.surahId === "number" &&
    track.surahId === surahId &&
    typeof track.ayahNumber === "number"
  ) {
    return track.ayahNumber;
  }

  const parsed = parseQuranAyahTrackId(track.id);
  return parsed?.surahId === surahId ? parsed.ayahNumber : null;
};

export const getQuranAyahAudioUrl = (
  surahAudio: QuranSurahAudio | null | undefined,
  ayah: QuranAyah,
) => {
  if (!surahAudio?.url) return null;

  try {
    const url = new URL(surahAudio.url);
    const pathParts = url.pathname.split("/");
    const audioSurahIndex = pathParts.findIndex(
      (part) => part === "audio-surah",
    );

    if (audioSurahIndex >= 0) {
      pathParts[audioSurahIndex] = "audio";
      pathParts[pathParts.length - 1] = `${ayah.number}.mp3`;
      url.pathname = pathParts.join("/");
      return url.toString();
    }
  } catch {
    // Fall through to string replacement for React Native URL edge cases.
  }

  return surahAudio.url
    .replace("/audio-surah/", "/audio/")
    .replace(/\/\d+\.mp3(?:\?.*)?$/, `/${ayah.number}.mp3`);
};

export const buildQuranAyahTracks = (
  surah: QuranSurahDetail,
  ayahs: readonly QuranAyah[],
  surahAudio: QuranSurahAudio | null | undefined,
) => {
  const queueId = getQuranQueueId(surah.id);

  return ayahs
    .map<QuranAyahTrack | null>((ayah) => {
      const url = getQuranAyahAudioUrl(surahAudio, ayah);
      if (!url) return null;

      return {
        id: getQuranAyahTrackId(surah.id, ayah.number_in_surah),
        queueId,
        surahId: surah.id,
        ayahNumber: ayah.number_in_surah,
        globalAyahNumber: ayah.number,
        url,
        title: `${surah.english_name} ${ayah.number_in_surah}`,
        artist: surahAudio?.reciter ?? "ar.alafasy",
        album: `Surah ${surah.english_name}`,
        description: surah.english_name_translation,
      };
    })
    .filter((track): track is QuranAyahTrack => track !== null);
};
