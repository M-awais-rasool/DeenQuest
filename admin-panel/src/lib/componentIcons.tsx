import {
  LanguageIcon,
  PencilIcon,
  PencilSquareIcon,
  SpeakerWaveIcon,
  HandRaisedIcon,
  BookOpenIcon,
  LightBulbIcon,
  QuestionMarkCircleIcon,
  PuzzlePieceIcon,
  LinkIcon,
  CheckCircleIcon,
  MagnifyingGlassIcon,
  RectangleGroupIcon,
  BoltIcon,
  ChatBubbleLeftRightIcon,
  ClipboardDocumentCheckIcon,
  AcademicCapIcon,
  Squares2X2Icon,
  DocumentTextIcon,
  HashtagIcon,
  RectangleStackIcon,
  PhotoIcon,
  VideoCameraIcon,
  MicrophoneIcon,
  TrophyIcon,
} from "@heroicons/react/24/outline";
import type { ComponentType, SVGProps } from "react";

type Icon = ComponentType<SVGProps<SVGSVGElement>>;

// Maps every backend component / mini-game / block name to a real icon so the
// admin UI never falls back to emoji "text icons".
const ICONS: Record<string, Icon> = {
  // Lesson components
  LetterIntroComponent: LanguageIcon,
  LetterFormsComponent: PencilIcon,
  PronunciationComponent: SpeakerWaveIcon,
  DuaCardComponent: HandRaisedIcon,
  HadithComponent: BookOpenIcon,
  QuranReaderComponent: BookOpenIcon,
  TipsComponent: LightBulbIcon,
  MCQComponent: QuestionMarkCircleIcon,
  FillBlankComponent: PencilSquareIcon,
  AyahBuilderComponent: PuzzlePieceIcon,
  MatchPairsComponent: LinkIcon,
  ListenChooseComponent: SpeakerWaveIcon,
  TrueFalseComponent: CheckCircleIcon,
  LetterHuntComponent: MagnifyingGlassIcon,
  SortBucketsComponent: RectangleGroupIcon,
  LightningRoundComponent: BoltIcon,
  ReflectionComponent: ChatBubbleLeftRightIcon,
  PrayerChecklistComponent: ClipboardDocumentCheckIcon,
  CertificateComponent: AcademicCapIcon,

  // Mini-games
  mcq: QuestionMarkCircleIcon,
  tap_match: LinkIcon,
  memory_cards: Squares2X2Icon,
  drag_drop: PuzzlePieceIcon,
  listen_choose: SpeakerWaveIcon,

  // Blocks
  TextBlock: DocumentTextIcon,
  AyahBlock: BookOpenIcon,
  HadithBlock: BookOpenIcon,
  CounterBlock: HashtagIcon,
  QuizBlock: QuestionMarkCircleIcon,
  AudioBlock: SpeakerWaveIcon,
  ChecklistBlock: ClipboardDocumentCheckIcon,
  FlashCardBlock: RectangleStackIcon,
  DragDropBlock: PuzzlePieceIcon,
  MatchBlock: LinkIcon,
  RewardBlock: TrophyIcon,
  ImageBlock: PhotoIcon,
  VideoBlock: VideoCameraIcon,
  VoicePracticeBlock: MicrophoneIcon,
};

export function iconFor(name: string): Icon {
  return ICONS[name] ?? Squares2X2Icon;
}

export function ComponentIcon({
  name,
  className = "w-5 h-5",
}: {
  name: string;
  className?: string;
}) {
  const Icon = iconFor(name);
  return <Icon className={className} />;
}
