/**
 * Originally written in Javascript by Dan Rouse, 2018.
 * Posted to gist here: https://gist.github.com/danrouse/52212f0de2fbfe33cfc56583f20ccb74
 *
 * Converted to Typescript for the purpose of this project.
 * From: https://github.com/dmf444/ArchiveManager/blob/bc7cf8749ef9ca1d62709182afd09f668983f69a/src/main/google/GmailUrlDecoder.ts
 */
const error = console.error;

export class GmailUrlDecoder {
  private fullAlphabet =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  private restrictedAlphabet = 'BCDFGHJKLMNPQRSTVWXZbcdfghjklmnpqrstvwxz';
  private threadPrefix = 'thread-';
  private messagePrefix = 'msg-';

  private isWhitespace = (str: string) => /^[\s\xa0]*$/.test(str);
  private isInvalidString = (str: string) =>
    str
      ? str.indexOf(this.threadPrefix) !== -1 ||
        str.indexOf(this.messagePrefix) !== -1
      : false;

  //   private atob = (str: string): string =>
  //     Buffer.from(str, 'base64').toString('binary');
  //   private btoa = (str: string): string =>
  //     Buffer.from(str, 'binary').toString('base64');

  private atob = (str: string): string => atob(str);
  private btoa = (str: string): string => btoa(str);

  public encode(str: string) {
    if (this.isWhitespace(str)) return str;
    str = str.replace(this.threadPrefix, '');
    return this.transliterate(
      this.btoa(str).replace(/=/g, ''),
      this.fullAlphabet,
      this.restrictedAlphabet
    );
  }

  public decode(str: string): string {
    if (
      this.isInvalidString(str) ||
      !/^[BCDFGHJKLMNPQRSTVWXZbcdfghjklmnpqrstvwxz]*$/.test(str)
    )
      return str;
    try {
      const transliterated = this.atob(
        this.transliterate(str, this.restrictedAlphabet, this.fullAlphabet)
      );
      return transliterated.indexOf(this.threadPrefix) === -1
        ? this.threadPrefix + transliterated
        : transliterated;
    } catch (err) {
      error(err);
      return str;
    }
  }

  private transliterate(
    subject: string,
    inputAlphabet: string,
    outputAlphabet: string
  ) {
    if (!outputAlphabet) throw Error('rd');

    let i, j;
    const inputAlphabetSize = inputAlphabet.length;
    const outputAlphabetSize = outputAlphabet.length;

    let isEqual = true;
    for (i = 0; i < subject.length; i++)
      if (subject.charAt(i) !== inputAlphabet.charAt(0)) {
        isEqual = false;
        break;
      }
    if (isEqual) return outputAlphabet.charAt(0);

    const inputAlphabetMap: Record<string, number> = {};
    for (let i: number = 0; i < inputAlphabetSize; i++)
      inputAlphabetMap[inputAlphabet.charAt(i)] = i;

    const inputIndices: number[] = [];
    for (i = subject.length - 1; i >= 0; i--) {
      const char = subject.charAt(i);
      if (typeof inputAlphabetMap[char] === 'undefined')
        throw Error('sd`' + subject + '`' + inputAlphabet + '`' + char);
      inputIndices.push(inputAlphabetMap[char]);
    }

    const outputIndices: number[] = [];
    for (i = inputIndices.length - 1; i >= 0; i--) {
      let offset = 0;
      for (j = 0; j < outputIndices.length; j++) {
        let index = outputIndices[j] * inputAlphabetSize + offset;
        if (index >= outputAlphabetSize) {
          const remainder = index % outputAlphabetSize;
          offset = (index - remainder) / outputAlphabetSize;
          index = remainder;
        } else {
          offset = 0;
        }
        outputIndices[j] = index;
      }
      while (offset) {
        const remainder = offset % outputAlphabetSize;
        outputIndices.push(remainder);
        offset = (offset - remainder) / outputAlphabetSize;
      }

      offset = inputIndices[i];
      for (j = 0; offset; j++) {
        if (j >= outputIndices.length) outputIndices.push(0);
        let index = outputIndices[j] + offset;
        if (index >= outputAlphabetSize) {
          const remainder = index % outputAlphabetSize;
          offset = (index - remainder) / outputAlphabetSize;
          index = remainder;
        } else {
          offset = 0;
        }
        outputIndices[j] = index;
      }
    }

    const outputBuffer = [];
    for (i = outputIndices.length - 1; i >= 0; i--) {
      const index = outputIndices[i];
      if (index >= outputAlphabet.length || index < 0)
        throw Error('td`' + outputIndices + '`' + index);
      outputBuffer.push(outputAlphabet.charAt(index));
    }
    return outputBuffer.join('');
  }
}
