/**
 * QuizComponent is now an alias of the upgraded, animated MCQComponent so
 * every existing seeded quiz instantly gains the premium feedback, haptics,
 * sound, and Arabic-aware rendering. Kept as a named export for the
 * component registry and backward compatibility.
 */
import { MCQComponent } from "./MCQComponent";

export const QuizComponent = MCQComponent;

export default QuizComponent;
