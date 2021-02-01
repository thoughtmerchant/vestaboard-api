'use strict';
/**
 * Create an instance of Vesta
 * @param {Object} defaultConfig the default config for the instance
 * @return {Vesta} A new instance of Vesta
 */
import axios from 'axios';
import { characterCode, specialChar, emptyBoard, LINE_LENGTH } from './values';
function isSpecial(char) {
    return specialChar.includes(char);
}
// function characterLength(string: string): number {
//   const splitArray = string.split(' ');
//   const length = splitArray.reduce((acc, word) => {
//     acc += isSpecial(word) ? 1 : word.length + 1;
//     return acc;
//   }, 0);
//   return length;
// }
function stringToArray(string) {
    const splitArray = string.split(' ');
    let charCount = 0;
    const unsplitLines = splitArray
        .map((word, i) => {
        let elements;
        switch (word) {
            case 'degreeSign':
            case 'redBlock':
            case 'orangeBlock':
            case 'yellowBlock':
            case 'greenBlock':
            case 'blueBlock':
            case 'violetBlock':
            case 'whiteBlock':
            case 'blackBlock':
                elements = [characterCode[word]];
                charCount += 1;
                break;
            case '':
                elements = [0];
                charCount += 1;
                break;
            case 'return':
                const charCount_mod_line = charCount % LINE_LENGTH;
                const remaining = LINE_LENGTH - charCount_mod_line;
                if (remaining < LINE_LENGTH) {
                    elements = new Array(remaining).fill(0);
                    charCount += remaining;
                }
                else {
                    elements = [];
                }
                break;
            default:
                elements = word.split('').map((c) => characterCode[c]);
                if (!isSpecial(splitArray[i + 1])) {
                    elements.push(0);
                }
                charCount += elements.length;
        }
        return [...elements];
    })
        .flat();
    // console.log(unsplitLines);
    return unsplitLines;
}
function makeBoard(string) {
    const arrayVersion = stringToArray(string);
    return arrayVersion;
}
export default class Vesta {
    constructor(config) {
        this.api_key = config.api_key;
        this.api_secret = config.api_secret;
        this.base_url = 'https://platform.vestaboard.com';
    }
    async request(endpoint = '', options) {
        const url = this.base_url + endpoint;
        const headers = {
            'X-Vestaboard-Api-Key': this.api_key,
            'X-Vestaboard-Api-Secret': this.api_secret,
        };
        const text = options.data;
        const method = options.method;
        // console.log('posting: ', { url, headers, options, text, method });
        const config = { url, method, headers, data: text };
        return axios(config).then((r) => r.data);
    }
    getSubscriptions() {
        const url = '/subscriptions';
        const options = { method: 'GET' };
        return this.request(url, options);
    }
    postMessage(subscriptionId, message) {
        const url = `/subscriptions/${subscriptionId}/message`;
        const data = Array.isArray(message)
            ? JSON.stringify({ characters: message })
            : JSON.stringify({ text: message });
        const options = { method: 'POST', data };
        return this.request(url, options);
    }
    getViewer() {
        const url = '/viewer';
        const options = { method: 'GET' };
        return this.request(url, options);
    }
    characterArrayFromString(string) {
        const charBoard = makeBoard(string);
        const newBoard = emptyBoard.map((line, row) => {
            const newLine = line.map((character, col) => {
                const lineIndex = row * 22;
                const useChar = charBoard[col + lineIndex];
                return useChar || 0;
            });
            return newLine;
        });
        return newBoard;
    }
    clearBoardTo(char, subscriptionId) {
        const clearBoard = emptyBoard.map((line) => 
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        line.map((_bit) => characterCode[char]));
        return this.postMessage(subscriptionId, clearBoard);
    }
}