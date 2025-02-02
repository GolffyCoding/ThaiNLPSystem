// ThaiNLPAnalyzer.js

const fs = require('fs');

class ThaiWordSegmentation {
    constructor() {
        this.wordBreakRules = {
            prefixes: [
                'การ', 'ความ', 'น่า', 'จะ', 'แสน', 'ใน', 'นัก', 'ช่าง',
                'พระ', 'นาง', 'นาย', 'เด็ก', 'คน', 'คุณ', 'หมอ'
            ],
            suffixes: [
                'ๆ', 'นะ', 'ครับ', 'ค่ะ', 'คะ', 'ไหม', 'เลย', 'มาก',
                'จัง', 'อยู่', 'แล้ว', 'ด้วย', 'เช่นกัน', 'ทีเดียว'
            ],
            conjunctions: [
                'และ', 'หรือ', 'แต่', 'ที่', 'ซึ่ง', 'เพราะ', 'ฉะนั้น',
                'ดังนั้น', 'เพื่อ', 'เมื่อ', 'ถ้า', 'จน', 'เพราะว่า'
            ]
        };
        
        this.specialChars = new Set(['ๆ', 'ฯ', '฿', '็', '์', '่', '้', '๊', '๋']);
    }

    isThaiConsonant(char) {
        const code = char.charCodeAt(0);
        return code >= 3585 && code <= 3630;
    }

    isThaiVowel(char) {
        const code = char.charCodeAt(0);
        return code >= 3632 && code <= 3654;
    }

    isThaiToneMark(char) {
        const code = char.charCodeAt(0);
        return code >= 3655 && code <= 3659;
    }

    segmentWords(text) {
        let words = [];
        let currentWord = '';
        let i = 0;

        while (i < text.length) {
            currentWord += text[i];
            
            let isWord = false;
            for (const ruleSet of Object.values(this.wordBreakRules)) {
                if (ruleSet.includes(currentWord)) {
                    words.push(currentWord);
                    currentWord = '';
                    isWord = true;
                    break;
                }
            }

            if (text[i] === ' ' && currentWord.trim()) {
                if (!isWord) {
                    words.push(currentWord.trim());
                    currentWord = '';
                }
            }

            i++;
        }

        if (currentWord.trim()) {
            words.push(currentWord.trim());
        }

        return words.filter(w => w !== ' ');
    }
}

class ThaiNLPAnalyzer {
    constructor() {
        this.wordSegmenter = new ThaiWordSegmentation();
        this.wordPatterns = {
            questions: [
                'ไหม', 'หรือ', 'ใคร', 'อะไร', 'ที่ไหน', 
                'เมื่อไร', 'อย่างไร', 'ทำไม', 'ได้ไหม'
            ],
            positive: [
                'ดี', 'สวัสดี', 'ขอบคุณ', 'ยินดี', 'รัก', 
                'ชอบ', 'เยี่ยม', 'สุข', 'สนุก'
            ],
            negative: [
                'แย่', 'เสียใจ', 'โกรธ', 'เกลียด', 'ไม่', 
                'ผิด', 'แก้', 'เลว', 'กลัว', 'เศร้า'
            ],
            polite: [
                'ครับ', 'ค่ะ', 'คะ', 'นะ', 'ขอบคุณ', 
                'ขอโทษ', 'ขออนุญาต', 'รบกวน'
            ]
        };

        try {
            const dictData = fs.readFileSync('custom_dict.json', 'utf8');
            this.customDict = JSON.parse(dictData);
        } catch (err) {
            this.customDict = {};
        }
    }

    analyzeText(text) {
        const words = this.wordSegmenter.segmentWords(text);
        const chars = Array.from(text);
        
        const charTypes = chars.map(char => {
            if (this.wordSegmenter.isThaiConsonant(char)) return 'consonant';
            if (this.wordSegmenter.isThaiVowel(char)) return 'vowel';
            if (this.wordSegmenter.isThaiToneMark(char)) return 'tone';
            if (this.wordSegmenter.specialChars.has(char)) return 'special';
            return 'other';
        });

        let sentimentScore = 0;
        let politenessScore = 0;
        words.forEach(word => {
            if (this.wordPatterns.positive.some(w => word.includes(w))) sentimentScore++;
            if (this.wordPatterns.negative.some(w => word.includes(w))) sentimentScore--;
            if (this.wordPatterns.polite.some(w => word.includes(w))) politenessScore++;
        });

        const questionTypes = new Set();
        this.wordPatterns.questions.forEach(qWord => {
            if (text.includes(qWord)) {
                questionTypes.add(qWord);
            }
        });

        const wordFreq = {};
        words.forEach(word => {
            wordFreq[word] = (wordFreq[word] || 0) + 1;
        });

        return {
            text: text,
            length: text.length,
            words: words,
            wordCount: words.length,
            uniqueWords: Object.keys(wordFreq).length,
            wordFrequency: wordFreq,
            characterAnalysis: {
                consonants: charTypes.filter(t => t === 'consonant').length,
                vowels: charTypes.filter(t => t === 'vowel').length,
                tones: charTypes.filter(t => t === 'tone').length,
                special: charTypes.filter(t => t === 'special').length,
                distribution: charTypes.reduce((acc, type) => {
                    acc[type] = (acc[type] || 0) + 1;
                    return acc;
                }, {})
            },
            sentiment: {
                score: sentimentScore,
                type: sentimentScore > 0 ? 'positive' : 
                      sentimentScore < 0 ? 'negative' : 'neutral',
            },
            style: {
                politeness: {
                    score: politenessScore,
                    level: politenessScore > 2 ? 'very polite' :
                           politenessScore > 0 ? 'polite' : 'casual'
                }
            },
            questionAnalysis: {
                isQuestion: questionTypes.size > 0,
                questionWords: Array.from(questionTypes)
            }
        };
    }
}

module.exports = {
    ThaiWordSegmentation,
    ThaiNLPAnalyzer
};