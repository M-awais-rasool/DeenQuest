package coach

type Letter struct {
	Char   string
	Name   string 
	Latin  string 
}

var Alphabet = []Letter{
	{"ا", "أَلِف", "Alif"},
	{"ب", "بَاء", "Ba"},
	{"ت", "تَاء", "Ta"},
	{"ث", "ثَاء", "Tha"},
	{"ج", "جِيم", "Jim"},
	{"ح", "حَاء", "Ha"},
	{"خ", "خَاء", "Kha"},
	{"د", "دَال", "Dal"},
	{"ذ", "ذَال", "Dhal"},
	{"ر", "رَاء", "Ra"},
	{"ز", "زَاي", "Zay"},
	{"س", "سِين", "Sin"},
	{"ش", "شِين", "Shin"},
	{"ص", "صَاد", "Sad"},
	{"ض", "ضَاد", "Dad"},
	{"ط", "طَاء", "Tta"},
	{"ظ", "ظَاء", "Dha"},
	{"ع", "عَيْن", "Ayn"},
	{"غ", "غَيْن", "Ghayn"},
	{"ف", "فَاء", "Fa"},
	{"ق", "قَاف", "Qaf"},
	{"ك", "كَاف", "Kaf"},
	{"ل", "لَام", "Lam"},
	{"م", "مِيم", "Mim"},
	{"ن", "نُون", "Nun"},
	{"ه", "هَاء", "Ha'"},
	{"و", "وَاو", "Waw"},
	{"ي", "يَاء", "Ya"},
}

var letterIndex = func() map[string]int {
	m := make(map[string]int, len(Alphabet))
	for i, l := range Alphabet {
		m[l.Char] = i
	}
	return m
}()

func LookupLetter(char string) (Letter, bool) {
	i, ok := letterIndex[char]
	if !ok {
		return Letter{}, false
	}
	return Alphabet[i], true
}

func LatinName(tag string) string {
	if l, ok := LookupLetter(tag); ok {
		return l.Latin
	}
	return tag
}
