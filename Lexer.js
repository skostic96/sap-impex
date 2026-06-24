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
};

class Lexer {
  REGEX = {
    // identifier after $, may contain alphanumeric characters, dots, dashes,
    // it's quite permissive, google it online
    // alphanumeric, dot, dash, underscore, testing one char at a time
    MACRO_IDENTIFIER: /[A-Za-z0-9._-]/,
    NEWLINE: /[\r\n]/,
    // dont treat newline as whitespace because it's tokenized
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

  /** @param {any} val */
  isDefined(val) {
    return val !== undefined && val !== null;
  }

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

    const inputLength = input.length;
    while (i < inputLength) {
      // we should start by figuring out what a line represents
      // - a comment,
      // - a quoted line,
      // - a macro definition,
      // - a script,
      // - userrights block start & end
      // - a header
      // - a value line

      // todo: document reference &
      // todo: special attribute @
      // todo: check if same as macro reference $
      // todo: add separate modifier branch `push [` to stack, `push '` to stack

      if (this.isDefined(this.STRUCTURAL[peek()])) {
        tokens.push(Factory.Token(peek(), line, this.STRUCTURAL[peek()]));
        ++i;
        continue;
      }

      if (this.REGEX.IDENTIFIER.test(peek())) {
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
        continue;
      }

      if (peek() === '$') {
        const macroStart = i;
        ++i;
        while (i < inputLength) {
          if (this.REGEX.MACRO_IDENTIFIER.test(peek())) {
            // todo: here handle userrights block (maybe i dont have to? parser's job?)
            ++i;
            continue;
          }
          break;
        }
        tokens.push(
          Factory.Token(
            input.slice(macroStart, i),
            line,
            TOKEN_TYPE.MACRO_REFERENCE,
          ),
        );
        continue;
      }

      if (peek() === '#') {
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
        continue;
      }

      if (peek() === '\\') {
        ++i;
        // Ignore the newline token
        consumeNewlineAdvanceLine();
        continue;
      }

      if (this.REGEX.NEWLINE.test(peek())) {
        const tokenLine = line;
        consumeNewlineAdvanceLine();
        tokens.push(
          Factory.Token(TOKEN.NEWLINE, tokenLine, TOKEN_TYPE.NEWLINE),
        );
        continue;
      }

      if (this.REGEX.WHITESPACE.test(peek())) {
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
        continue;
      }

      // todo: split double quote to separate token
      if (input.charAt(i) === '"') {
        let quoteStart = i;
        // this is a start of a quoted string
        ++i;
        // collect quoted string
        while (i < inputLength) {
          // ending or escaping quote
          if (input.charAt(i) === '"') {
            ++i;
            if (input.charAt(i) === '"') {
              // escaped quote
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
            if (this.REGEX.MACRO_IDENTIFIER.test(input.charAt(i))) {
              // start of macro
              if (quoteStart < macroStart) {
                // not empty
                tokens.push(
                  Factory.Token(input.slice(quoteStart, macroStart), line),
                );
              }
              ++i;
              while (i < inputLength) {
                // find last
                if (this.REGEX.MACRO_IDENTIFIER.test(input.charAt(i))) {
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
                  line,
                  TOKEN_TYPE.MACRO_REFERENCE,
                ),
              );
              quoteStart = i;
            }
          }

          ++i;
        }

        tokens.push(Factory.Token(input.slice(quoteStart, i), line));
        continue;
      }

      ++i;
    }

    return tokens;
  }
}

module.exports = {
  Lexer,
  Factory,
  TOKEN,
  TOKEN_TYPE,
};
