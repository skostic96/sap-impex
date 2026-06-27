class Token {
  /**
   * @param {string} value
   * @param {number} line
   */
  constructor(value, line, type) {
    this.value = value;
    this.line = line;
    this.type = type;
  }
}

const Factory = {
  /**
   * @param {string} value
   * @param {number} line
   */
  Token: function (value, line, type) {
    return new Token(value, line, type);
  },
};

const TOKEN = {
  NEWLINE: '<NL>',
  SINGLE_QUOTE: "'",
  DOUBLE_QUOTE: '"',
};

const TOKEN_TYPE = {
  WHITESPACE: 'WHITESPACE',
  NEWLINE: 'NEWLINE',
  COMMENT: 'COMMENT',
  SCRIPT: 'SCRIPT',
  MACRO_REFERENCE: 'MACRO_REFERENCE',
  IDENTIFIER: 'IDENTIFIER',
  SPECIAL_ATTRIBUTE: 'SPECIAL_ATTRIBUTE',
  DOCUMENT_REFERENCE: 'DOCUMENT_REFERENCE',
  //
  SEMICOLON: 'SEMICOLON',
  LPAREN: 'LPAREN',
  RPAREN: 'RPAREN',
  LBRACKET: 'LBRACKET',
  RBRACKET: 'RBRACKET',
  EQUALS: 'EQUALS',
  COMMA: 'COMMA',
  DOUBLE_QUOTE: 'DOUBLE_QUOTE',
  SINGLE_QUOTE: 'SINGLE_QUOTE',
};

class Lexer {
  REGEX = {
    // identifier after $, may contain alphanumeric characters, dots, dashes,
    // it's quite permissive, google it online
    // alphanumeric, dot, dash, underscore, testing one char at a time
    SIGIL_IDENTIFIER: /[A-Za-z0-9._-]/,
    NEWLINE: /[\r\n]/,
    // dont treat newline as whitespace because it's separately tokenized
    WHITESPACE: /[ \t]/,
    IDENTIFIER: /[A-Za-z0-9_]/,
  };

  STRUCTURAL = {
    '(': TOKEN_TYPE.LPAREN,
    ')': TOKEN_TYPE.RPAREN,
    '[': TOKEN_TYPE.LBRACKET,
    ']': TOKEN_TYPE.RBRACKET,
    '=': TOKEN_TYPE.EQUALS,
    ',': TOKEN_TYPE.COMMA,
    ';': TOKEN_TYPE.SEMICOLON,
  };

  SIGIL = {
    $: TOKEN_TYPE.MACRO_REFERENCE,
    '&': TOKEN_TYPE.DOCUMENT_REFERENCE,
    '@': TOKEN_TYPE.SPECIAL_ATTRIBUTE,
  };

  QUOTE = {
    [TOKEN.SINGLE_QUOTE]: TOKEN_TYPE.SINGLE_QUOTE,
    [TOKEN.DOUBLE_QUOTE]: TOKEN_TYPE.DOUBLE_QUOTE,
  };

  /** @param {any} val */
  isDefined(val) {
    return val !== undefined && val !== null;
  }

  /** @param {number} idx */
  peek(idx = 0) {
    return this.source.charAt(this.i + idx);
  }

  /**
   * @param {string} input
   */
  tokenize(input) {
    /** @type{Token[]} */
    const tokens = [];

    let i = 0;
    let line = 1;

    /** @param {number} idx */
    const peek = (idx = 0) => input.charAt(i + idx);

    function consumeNewlineAdvanceLine() {
      // if CR is followed by LF, eat both as one break
      if (peek() === '\r' && peek(1) === '\n') {
        ++i;
      }
      ++i;
      ++line;
    }

    let pendingStart = i;

    function flushPendingContent() {
      // not empty
      if (pendingStart < i) {
        tokens.push(
          Factory.Token(
            input.slice(pendingStart, i),
            line,
            TOKEN_TYPE.IDENTIFIER,
          ),
        );
      }
    }

    function resetPendingContent() {
      pendingStart = i;
    }

    const inputLength = input.length;
    while (i < inputLength) {
      if (this.isDefined(this.STRUCTURAL[peek()])) {
        flushPendingContent();
        tokens.push(Factory.Token(peek(), line, this.STRUCTURAL[peek()]));
        ++i;
        resetPendingContent();
        continue;
      }

      if (this.REGEX.IDENTIFIER.test(peek())) {
        flushPendingContent();
        const identifierStart = i;
        ++i;
        while (i < inputLength) {
          if (this.REGEX.IDENTIFIER.test(peek())) {
            ++i;
            continue;
          }
          break;
        }
        tokens.push(
          Factory.Token(
            input.slice(identifierStart, i),
            line,
            TOKEN_TYPE.IDENTIFIER,
          ),
        );
        resetPendingContent();
        continue;
      }

      if (this.isDefined(this.SIGIL[peek()])) {
        const SIGIL_TYPE = peek();
        flushPendingContent();
        resetPendingContent();
        const sigilStart = i;
        ++i;
        if (this.REGEX.SIGIL_IDENTIFIER.test(peek())) {
          while (i < inputLength) {
            if (this.REGEX.SIGIL_IDENTIFIER.test(peek())) {
              ++i;
              continue;
            }
            break;
          }
          tokens.push(
            Factory.Token(
              input.slice(sigilStart, i),
              line,
              this.SIGIL[SIGIL_TYPE],
            ),
          );
          resetPendingContent();
          continue;
        }
        continue;
      }

      if (peek() === '#') {
        flushPendingContent();
        const commentOrScriptStart = i;
        ++i;
        if (peek() === '%') {
          while (i < inputLength) {
            // eat to newline (don't consume it)
            if (!this.REGEX.NEWLINE.test(peek())) {
              ++i;
              continue;
            }
            break;
          }
          tokens.push(
            Factory.Token(
              input.slice(commentOrScriptStart, i),
              line,
              TOKEN_TYPE.SCRIPT,
            ),
          );
          resetPendingContent();
          continue;
        }
        while (i < inputLength) {
          // eat to newline don't consume it
          if (!this.REGEX.NEWLINE.test(peek())) {
            ++i;
            continue;
          }
          break;
        }
        tokens.push(
          Factory.Token(
            input.slice(commentOrScriptStart, i),
            line,
            TOKEN_TYPE.COMMENT,
          ),
        );
        resetPendingContent();
        continue;
      }

      if (peek() === '\\') {
        flushPendingContent();
        const backslashStart = i;
        ++i;
        if (this.REGEX.NEWLINE.test(peek())) {
          // Ignore the newline token
          consumeNewlineAdvanceLine();
          resetPendingContent();
          continue;
        }
        tokens.push(
          Factory.Token(
            input.slice(backslashStart, i),
            line,
            TOKEN_TYPE.IDENTIFIER,
          ),
        );
        resetPendingContent();
        continue;
      }

      if (this.REGEX.NEWLINE.test(peek())) {
        flushPendingContent();
        const tokenLine = line;
        consumeNewlineAdvanceLine();
        tokens.push(
          Factory.Token(TOKEN.NEWLINE, tokenLine, TOKEN_TYPE.NEWLINE),
        );
        resetPendingContent();
        continue;
      }

      if (this.REGEX.WHITESPACE.test(peek())) {
        flushPendingContent();
        let whitespaceStart = i;
        ++i;
        while (i < inputLength) {
          if (this.REGEX.WHITESPACE.test(peek())) {
            ++i;
            continue;
          }
          break;
        }
        tokens.push(
          Factory.Token(
            input.slice(whitespaceStart, i),
            line,
            TOKEN_TYPE.WHITESPACE,
          ),
        );
        resetPendingContent();
        continue;
      }

      if (this.isDefined(this.QUOTE[peek()])) {
        // Preserve opening quote
        const QUOTE_VALUE = peek();
        const QUOTE_TYPE = this.QUOTE[peek()];
        const QUOTE_LINE = line;

        flushPendingContent();
        tokens.push(Factory.Token(peek(), line, QUOTE_TYPE));
        // this is a start of a quoted string
        ++i;
        let quoteStart = i;
        // collect quoted string
        while (i < inputLength) {
          if (peek() === '\n') {
            ++i;
            ++line;
            continue;
          }

          if (peek() === '\r') {
            ++i;
            ++line;
            if (peek() === '\n') {
              ++i;
              continue;
            }
            continue;
          }

          // ending or escaping quote
          if (input.charAt(i) === QUOTE_VALUE) {
            // if escaped quote
            if (peek(1) === QUOTE_VALUE) {
              // eat both quotes
              ++i;
              ++i;
              continue;
            }
            break;
          }

          if (input.charAt(i) === '$') {
            const macroStart = i;
            // maybe start of macro
            ++i;
            // at least one valid char trailing $
            if (this.REGEX.SIGIL_IDENTIFIER.test(input.charAt(i))) {
              // start of macro
              if (quoteStart < macroStart) {
                // not empty
                tokens.push(
                  Factory.Token(
                    input.slice(quoteStart, macroStart),
                    QUOTE_LINE,
                    TOKEN_TYPE.IDENTIFIER,
                  ),
                );
              }
              ++i;
              while (i < inputLength) {
                // find last
                if (this.REGEX.SIGIL_IDENTIFIER.test(input.charAt(i))) {
                  // parse macro stuff
                  ++i;
                  continue;
                }
                break;
              }
              // macro end, store it
              tokens.push(
                Factory.Token(
                  input.slice(macroStart, i),
                  QUOTE_LINE,
                  TOKEN_TYPE.MACRO_REFERENCE,
                ),
              );
              quoteStart = i;
              continue;
            }
            continue;
          }

          ++i;
        }

        if (quoteStart < i) {
          tokens.push(
            Factory.Token(
              input.slice(quoteStart, i),
              QUOTE_LINE,
              TOKEN_TYPE.IDENTIFIER,
            ),
          );
        }
        tokens.push(Factory.Token(peek(), QUOTE_LINE, QUOTE_TYPE));
        ++i;
        resetPendingContent();
        continue;
      }

      ++i;
    }

    flushPendingContent();
    resetPendingContent();

    return tokens;
  }
}

module.exports = {
  Lexer,
  Factory,
  TOKEN,
  TOKEN_TYPE,
};
