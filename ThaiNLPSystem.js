// ThaiNLPSystem.js
const fs = require('fs');
const { ThaiNLPAnalyzer } = require('./ThaiNLPAnalyzer');

class ThaiNLPSystem {
    constructor() {
        this.analyzer = new ThaiNLPAnalyzer();
        this.mappings = this.loadMappings();
    }

    loadMappings() {
        try {
            return JSON.parse(fs.readFileSync('mappings.json', 'utf8'));
        } catch (err) {
            return { mappings: [] };
        }
    }

    processInput(input) {
        const nlpResult = this.analyzer.analyzeText(input);
        
        const context = {
            sentiment: nlpResult.sentiment.type,
            politeness: nlpResult.style.politeness.level,
            isQuestion: nlpResult.questionAnalysis.isQuestion
        };

        const responseObj = this.generateResponse(input, context);
        return { response: responseObj.response };
    }

    generateResponse(input, context) {
        let bestMatch = null;
        let highestConfidence = 0;

        for (const mapping of this.mappings.mappings) {
            const confidence = this.calculateConfidence(input, mapping, context);
            if (confidence > highestConfidence) {
                highestConfidence = confidence;
                bestMatch = mapping;
            }
        }

        return {
            response: bestMatch ? bestMatch.replacement : this.getDefaultResponse(context)
        };
    }

    calculateConfidence(input, mapping, context) {
        if (mapping.target === input) return 1.0;
        if (input.includes(mapping.target) || mapping.target.includes(input)) {
            let confidence = 0.5;
            if (mapping.context) {
                if (mapping.context.sentiment === context.sentiment) confidence += 0.1;
                if (mapping.context.politeness === context.politeness) confidence += 0.1;
                if (mapping.context.isQuestion === context.isQuestion) confidence += 0.1;
            }
            return confidence;
        }
        return 0;
    }

    getDefaultResponse(context) {
        if (context.isQuestion) {
            return context.politeness === 'very polite' ? 
                'ขออภัยค่ะ/ครับ ดิฉัน/ผมไม่แน่ใจในคำตอบ กรุณาถามใหม่อีกครั้ง' :
                'ขอโทษนะ ไม่แน่ใจ ลองถามใหม่ได้ไหม';
        }
        return context.politeness === 'very polite' ?
            'ขอบคุณที่แจ้งให้ทราบค่ะ/ครับ' :
            'เข้าใจแล้ว ขอบคุณนะ';
    }
}

module.exports = { ThaiNLPSystem };