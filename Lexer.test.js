const { Lexer, Factory, TOKEN_TYPE, TOKEN } = require('./Lexer');

describe('Lexer', () => {
  it('should parse macros correctly', () => {
    const macrosImpex = `
"$mediaPrefix/h12/banner.png"

# One string on a line
"$mediaPrefix/h12/banner-secondary.png"

# Two consecutive strings on the same line
"Homepage Banner Slot" "$2mediaP2refix.something-else.property/h12/banner-secondary.png"

"something"`;

    const tokens = new Lexer().tokenize(macrosImpex);

    expect(tokens).toEqual([
      //
      Factory.Token('<NL>', 1, TOKEN_TYPE.NEWLINE),
      //
      Factory.Token('"', 2, TOKEN_TYPE.DOUBLE_QUOTE),
      Factory.Token('$mediaPrefix', 2, TOKEN_TYPE.MACRO_REFERENCE),
      Factory.Token('/h12/banner.png', 2, TOKEN_TYPE.IDENTIFIER),
      Factory.Token('"', 2, TOKEN_TYPE.DOUBLE_QUOTE),
      Factory.Token('<NL>', 2, TOKEN_TYPE.NEWLINE),
      //
      Factory.Token('<NL>', 3, TOKEN_TYPE.NEWLINE),
      //
      Factory.Token('# One string on a line', 4, TOKEN_TYPE.COMMENT),
      Factory.Token('<NL>', 4, TOKEN_TYPE.NEWLINE),
      //
      Factory.Token('"', 5, TOKEN_TYPE.DOUBLE_QUOTE),
      Factory.Token('$mediaPrefix', 5, TOKEN_TYPE.MACRO_REFERENCE),
      Factory.Token('/h12/banner-secondary.png', 5, TOKEN_TYPE.IDENTIFIER),
      Factory.Token('"', 5, TOKEN_TYPE.DOUBLE_QUOTE),
      Factory.Token('<NL>', 5, TOKEN_TYPE.NEWLINE),
      //
      Factory.Token('<NL>', 6, TOKEN_TYPE.NEWLINE),
      //
      Factory.Token(
        '# Two consecutive strings on the same line',
        7,
        TOKEN_TYPE.COMMENT,
      ),
      Factory.Token('<NL>', 7, TOKEN_TYPE.NEWLINE),
      //
      Factory.Token('"', 8, TOKEN_TYPE.DOUBLE_QUOTE),
      Factory.Token('Homepage Banner Slot', 8, TOKEN_TYPE.IDENTIFIER),
      Factory.Token('"', 8, TOKEN_TYPE.DOUBLE_QUOTE),
      Factory.Token(' ', 8, TOKEN_TYPE.WHITESPACE),
      Factory.Token('"', 8, TOKEN_TYPE.DOUBLE_QUOTE),
      // should parse macro names containing dots and dashes and numbers
      Factory.Token(
        '$2mediaP2refix.something-else.property',
        8,
        TOKEN_TYPE.MACRO_REFERENCE,
      ),
      Factory.Token('/h12/banner-secondary.png', 8, TOKEN_TYPE.IDENTIFIER),
      Factory.Token('"', 8, TOKEN_TYPE.DOUBLE_QUOTE),
      Factory.Token('<NL>', 8, TOKEN_TYPE.NEWLINE),
      //
      Factory.Token('<NL>', 9, TOKEN_TYPE.NEWLINE),
      //
      Factory.Token('"', 10, TOKEN_TYPE.DOUBLE_QUOTE),
      Factory.Token('something', 10, TOKEN_TYPE.IDENTIFIER),
      Factory.Token('"', 10, TOKEN_TYPE.DOUBLE_QUOTE),
    ]);
  });

  it('should handle double quote containing newlines', () => {
    const input = `"$mediaPrefix/line one
line two
$another.macro-ref/tail"`;

    const tokens = new Lexer().tokenize(input);

    expect(tokens).toEqual([
      //
      Factory.Token('"', 1, TOKEN_TYPE.DOUBLE_QUOTE),
      Factory.Token('$mediaPrefix', 1, TOKEN_TYPE.MACRO_REFERENCE),
      Factory.Token('/line one\nline two\n', 1, TOKEN_TYPE.IDENTIFIER),
      Factory.Token('$another.macro-ref', 1, TOKEN_TYPE.MACRO_REFERENCE),
      Factory.Token('/tail', 1, TOKEN_TYPE.IDENTIFIER),
      Factory.Token('"', 1, TOKEN_TYPE.DOUBLE_QUOTE),
    ]);
  });

  it('handles basic single quotes', () => {
    const input = `'some text'`;

    expect(new Lexer().tokenize(input)).toEqual([
      Factory.Token("'", 1, TOKEN_TYPE.SINGLE_QUOTE),
      Factory.Token('some text', 1, TOKEN_TYPE.IDENTIFIER),
      Factory.Token("'", 1, TOKEN_TYPE.SINGLE_QUOTE),
    ]);
  });

  it('handles double quote inside single quotes', () => {
    const input = `'some " quote "something"'`;

    expect(new Lexer().tokenize(input)).toEqual([
      Factory.Token("'", 1, TOKEN_TYPE.SINGLE_QUOTE),
      Factory.Token('some " quote "something"', 1, TOKEN_TYPE.IDENTIFIER),
      Factory.Token("'", 1, TOKEN_TYPE.SINGLE_QUOTE),
    ]);
  });

  it('handles escaping in single quotes', () => {
    const input = `'some '' escaped '''`;

    expect(new Lexer().tokenize(input)).toEqual([
      Factory.Token("'", 1, TOKEN_TYPE.SINGLE_QUOTE),
      Factory.Token("some '' escaped ''", 1, TOKEN_TYPE.IDENTIFIER),
      Factory.Token("'", 1, TOKEN_TYPE.SINGLE_QUOTE),
    ]);
  });

  it('tokenizes macros in single quotes', () => {
    const input = `'some $macro quote'`;

    expect(new Lexer().tokenize(input)).toEqual([
      Factory.Token("'", 1, TOKEN_TYPE.SINGLE_QUOTE),
      Factory.Token('some ', 1, TOKEN_TYPE.IDENTIFIER),
      Factory.Token('$macro', 1, TOKEN_TYPE.MACRO_REFERENCE),
      Factory.Token(' quote', 1, TOKEN_TYPE.IDENTIFIER),
      Factory.Token("'", 1, TOKEN_TYPE.SINGLE_QUOTE),
    ]);
  });

  it('tokenizes lone $ as identifier in single quotes', () => {
    const input = `'some $ not macro quote'`;

    expect(new Lexer().tokenize(input)).toEqual([
      Factory.Token("'", 1, TOKEN_TYPE.SINGLE_QUOTE),
      Factory.Token('some $ not macro quote', 1, TOKEN_TYPE.IDENTIFIER),
      Factory.Token("'", 1, TOKEN_TYPE.SINGLE_QUOTE),
    ]);
  });

  it('should handle escaped newline outside of comment', () => {
    const input = `
"line one"\
"line two"
    `;
    const tokens = new Lexer().tokenize(input);

    expect(tokens).toEqual([
      //
      Factory.Token('<NL>', 1, TOKEN_TYPE.NEWLINE),
      //
      Factory.Token('"', 2, TOKEN_TYPE.DOUBLE_QUOTE),
      Factory.Token('line one""line two', 2, TOKEN_TYPE.IDENTIFIER),
      Factory.Token('"', 2, TOKEN_TYPE.DOUBLE_QUOTE),
      Factory.Token('<NL>', 2, TOKEN_TYPE.NEWLINE),
      //
      Factory.Token('    ', 3, TOKEN_TYPE.WHITESPACE),
    ]);
  });

  it('should handle comment after macro, quotes', () => {
    const input = `\
$macro=definition #some comment here
"a quote" #some comment here
"a quote here #confuse lexer
newline" # comment too`;
    const tokens = new Lexer().tokenize(input);

    expect(tokens).toEqual([
      //
      Factory.Token('$macro', 1, TOKEN_TYPE.MACRO_REFERENCE),
      Factory.Token('=', 1, TOKEN_TYPE.EQUALS),
      Factory.Token('definition', 1, TOKEN_TYPE.IDENTIFIER),
      Factory.Token(' ', 1, TOKEN_TYPE.WHITESPACE),
      Factory.Token('#some comment here', 1, TOKEN_TYPE.COMMENT),
      Factory.Token('<NL>', 1, TOKEN_TYPE.NEWLINE),
      //
      Factory.Token('"', 2, TOKEN_TYPE.DOUBLE_QUOTE),
      Factory.Token('a quote', 2, TOKEN_TYPE.IDENTIFIER),
      Factory.Token('"', 2, TOKEN_TYPE.DOUBLE_QUOTE),
      Factory.Token(' ', 2, TOKEN_TYPE.WHITESPACE),
      Factory.Token('#some comment here', 2, TOKEN_TYPE.COMMENT),
      Factory.Token('<NL>', 2, TOKEN_TYPE.NEWLINE),
      //
      Factory.Token('"', 3, TOKEN_TYPE.DOUBLE_QUOTE),
      Factory.Token(
        'a quote here #confuse lexer\nnewline',
        3,
        TOKEN_TYPE.IDENTIFIER,
      ),
      Factory.Token('"', 3, TOKEN_TYPE.DOUBLE_QUOTE),
      //
      Factory.Token(' ', 4, TOKEN_TYPE.WHITESPACE),
      Factory.Token('# comment too', 4, TOKEN_TYPE.COMMENT),
    ]);
  });

  it('reflects newlines consumed inside the previous quote', () => {
    const input = `"a\nb"\n"c\nd"

$macro=sth
`;

    expect(new Lexer().tokenize(input)).toEqual([
      Factory.Token('"', 1, TOKEN_TYPE.DOUBLE_QUOTE),
      Factory.Token('a\nb', 1, TOKEN_TYPE.IDENTIFIER),
      Factory.Token('"', 1, TOKEN_TYPE.DOUBLE_QUOTE),
      //
      Factory.Token(TOKEN.NEWLINE, 2, TOKEN_TYPE.NEWLINE),
      //
      Factory.Token('"', 3, TOKEN_TYPE.DOUBLE_QUOTE),
      Factory.Token('c\nd', 3, TOKEN_TYPE.IDENTIFIER),
      Factory.Token('"', 3, TOKEN_TYPE.DOUBLE_QUOTE),
      //
      Factory.Token(TOKEN.NEWLINE, 4, TOKEN_TYPE.NEWLINE),
      //
      Factory.Token(TOKEN.NEWLINE, 5, TOKEN_TYPE.NEWLINE),
      //
      Factory.Token('$macro', 6, TOKEN_TYPE.MACRO_REFERENCE),
      Factory.Token('=', 6, TOKEN_TYPE.EQUALS),
      Factory.Token('sth', 6, TOKEN_TYPE.IDENTIFIER),
      //
      Factory.Token(TOKEN.NEWLINE, 6, TOKEN_TYPE.NEWLINE),
    ]);
  });

  it.each([
    // ---
    {
      endOfLineType: 'LF',
      newlineChar: '\n',
      quoteChar: '"',
      quoteType: TOKEN_TYPE.DOUBLE_QUOTE,
    },
    {
      endOfLineType: 'CR',
      newlineChar: '\r',
      quoteChar: '"',
      quoteType: TOKEN_TYPE.DOUBLE_QUOTE,
    },
    {
      endOfLineType: 'CRLF',
      newlineChar: '\r\n',
      quoteChar: '"',
      quoteType: TOKEN_TYPE.DOUBLE_QUOTE,
    },
    // ---
    {
      endOfLineType: 'LF',
      newlineChar: '\n',
      quoteChar: "'",
      quoteType: TOKEN_TYPE.SINGLE_QUOTE,
    },
    {
      endOfLineType: 'CR',
      newlineChar: '\r',
      quoteChar: "'",
      quoteType: TOKEN_TYPE.SINGLE_QUOTE,
    },
    {
      endOfLineType: 'CRLF',
      newlineChar: '\r\n',
      quoteChar: "'",
      quoteType: TOKEN_TYPE.SINGLE_QUOTE,
    },
  ])(
    'handles line tracking correctly on multiline quote: [ end of line type - $endOfLineType, quote: $quoteType ]',
    ({ endOfLineType, newlineChar, quoteChar, quoteType }) => {
      const input = `${quoteChar}foo${newlineChar}bar${quoteChar}`;
      expect(new Lexer().tokenize(input)).toEqual([
        Factory.Token(quoteChar, 1, quoteType),
        Factory.Token(`foo${newlineChar}bar`, 1, TOKEN_TYPE.IDENTIFIER),
        Factory.Token(quoteChar, 1, quoteType),
      ]);
    },
  );

  it('should handle script lines', () => {
    const input = `\
#% impex.enableCodeExecution(true);
#% if: condition
#% endif:
#%groovy% beforeEach: line.clear();\
`;

    const tokens = new Lexer().tokenize(input);

    expect(tokens).toEqual([
      Factory.Token(
        '#% impex.enableCodeExecution(true);',
        1,
        TOKEN_TYPE.SCRIPT,
      ),
      Factory.Token('<NL>', 1, TOKEN_TYPE.NEWLINE),
      Factory.Token('#% if: condition', 2, TOKEN_TYPE.SCRIPT),
      Factory.Token('<NL>', 2, TOKEN_TYPE.NEWLINE),
      Factory.Token('#% endif:', 3, TOKEN_TYPE.SCRIPT),
      Factory.Token('<NL>', 3, TOKEN_TYPE.NEWLINE),
      Factory.Token(
        '#%groovy% beforeEach: line.clear();',
        4,
        TOKEN_TYPE.SCRIPT,
      ),
    ]);
  });

  it('should handle structural tokens', () => {
    const tokens = new Lexer().tokenize(`()[]=,;`);

    expect(tokens).toEqual([
      Factory.Token('(', 1, TOKEN_TYPE.LPAREN),
      Factory.Token(')', 1, TOKEN_TYPE.RPAREN),
      Factory.Token('[', 1, TOKEN_TYPE.LBRACKET),
      Factory.Token(']', 1, TOKEN_TYPE.RBRACKET),
      Factory.Token('=', 1, TOKEN_TYPE.EQUALS),
      Factory.Token(',', 1, TOKEN_TYPE.COMMA),
      Factory.Token(';', 1, TOKEN_TYPE.SEMICOLON),
    ]);
  });

  it('should handle identifiers', () => {
    const input = `INSERT_UPDATE Product code123 _underscore 9starts_with_digit`;
    const tokens = new Lexer().tokenize(input);

    expect(tokens).toEqual([
      Factory.Token('INSERT_UPDATE', 1, TOKEN_TYPE.IDENTIFIER),
      Factory.Token(' ', 1, TOKEN_TYPE.WHITESPACE),
      Factory.Token('Product', 1, TOKEN_TYPE.IDENTIFIER),
      Factory.Token(' ', 1, TOKEN_TYPE.WHITESPACE),
      Factory.Token('code123', 1, TOKEN_TYPE.IDENTIFIER),
      Factory.Token(' ', 1, TOKEN_TYPE.WHITESPACE),
      Factory.Token('_underscore', 1, TOKEN_TYPE.IDENTIFIER),
      Factory.Token(' ', 1, TOKEN_TYPE.WHITESPACE),
      Factory.Token('9starts_with_digit', 1, TOKEN_TYPE.IDENTIFIER),
    ]);
  });

  // todo: rename tests to shorter (handles identifiers)
  // instead of (should handle identifiers)
  it('tokenizes valid impex table', () => {
    const input = `\
UPDATE Product[batchmode=true];code[unique=true];supercategories(code,$contentCV)[mode=append]
;PROD-001;newCategory
`;
    expect(new Lexer().tokenize(input)).toEqual([
      Factory.Token('UPDATE', 1, TOKEN_TYPE.IDENTIFIER),
      Factory.Token(' ', 1, TOKEN_TYPE.WHITESPACE),
      Factory.Token('Product', 1, TOKEN_TYPE.IDENTIFIER),
      Factory.Token('[', 1, TOKEN_TYPE.LBRACKET),
      Factory.Token('batchmode', 1, TOKEN_TYPE.IDENTIFIER),
      Factory.Token('=', 1, TOKEN_TYPE.EQUALS),
      Factory.Token('true', 1, TOKEN_TYPE.IDENTIFIER),
      Factory.Token(']', 1, TOKEN_TYPE.RBRACKET),
      Factory.Token(';', 1, TOKEN_TYPE.SEMICOLON),
      Factory.Token('code', 1, TOKEN_TYPE.IDENTIFIER),
      Factory.Token('[', 1, TOKEN_TYPE.LBRACKET),
      Factory.Token('unique', 1, TOKEN_TYPE.IDENTIFIER),
      Factory.Token('=', 1, TOKEN_TYPE.EQUALS),
      Factory.Token('true', 1, TOKEN_TYPE.IDENTIFIER),
      Factory.Token(']', 1, TOKEN_TYPE.RBRACKET),
      Factory.Token(';', 1, TOKEN_TYPE.SEMICOLON),
      Factory.Token('supercategories', 1, TOKEN_TYPE.IDENTIFIER),
      Factory.Token('(', 1, TOKEN_TYPE.LPAREN),
      Factory.Token('code', 1, TOKEN_TYPE.IDENTIFIER),
      Factory.Token(',', 1, TOKEN_TYPE.COMMA),
      Factory.Token('$contentCV', 1, TOKEN_TYPE.MACRO_REFERENCE),
      Factory.Token(')', 1, TOKEN_TYPE.RPAREN),
      Factory.Token('[', 1, TOKEN_TYPE.LBRACKET),
      Factory.Token('mode', 1, TOKEN_TYPE.IDENTIFIER),
      Factory.Token('=', 1, TOKEN_TYPE.EQUALS),
      Factory.Token('append', 1, TOKEN_TYPE.IDENTIFIER),
      Factory.Token(']', 1, TOKEN_TYPE.RBRACKET),
      Factory.Token(TOKEN.NEWLINE, 1, TOKEN_TYPE.NEWLINE),
      //
      Factory.Token(';', 2, TOKEN_TYPE.SEMICOLON),
      Factory.Token('PROD', 2, TOKEN_TYPE.IDENTIFIER),
      Factory.Token('-', 2, TOKEN_TYPE.IDENTIFIER),
      Factory.Token('001', 2, TOKEN_TYPE.IDENTIFIER),
      Factory.Token(';', 2, TOKEN_TYPE.SEMICOLON),
      Factory.Token('newCategory', 2, TOKEN_TYPE.IDENTIFIER),
      Factory.Token(TOKEN.NEWLINE, 2, TOKEN_TYPE.NEWLINE),
    ]);
  });

  it('stores unrecognized characters as identifier, flushes trailing content, when there is no EOF newline', () => {
    const input = `
$macro=stuff "quote" @????`; // This no EOF newline is critical to this test
    expect(new Lexer().tokenize(input)).toEqual([
      Factory.Token(TOKEN.NEWLINE, 1, TOKEN_TYPE.NEWLINE),
      Factory.Token('$macro', 2, TOKEN_TYPE.MACRO_REFERENCE),
      Factory.Token('=', 2, TOKEN_TYPE.EQUALS),
      Factory.Token('stuff', 2, TOKEN_TYPE.IDENTIFIER),
      Factory.Token(' ', 2, TOKEN_TYPE.WHITESPACE),
      Factory.Token('"', 2, TOKEN_TYPE.DOUBLE_QUOTE),
      Factory.Token('quote', 2, TOKEN_TYPE.IDENTIFIER),
      Factory.Token('"', 2, TOKEN_TYPE.DOUBLE_QUOTE),
      Factory.Token(' ', 2, TOKEN_TYPE.WHITESPACE),
      Factory.Token('@????', 2, TOKEN_TYPE.IDENTIFIER),
    ]);
  });

  it('stores implicitly stored characters as identifier, flushes training content, when there is EOF newline', () => {
    const input = `
$macro=stuff "quote" @????
`; // This EOF newline is critical to this test

    expect(new Lexer().tokenize(input)).toEqual([
      Factory.Token(TOKEN.NEWLINE, 1, TOKEN_TYPE.NEWLINE),
      Factory.Token('$macro', 2, TOKEN_TYPE.MACRO_REFERENCE),
      Factory.Token('=', 2, TOKEN_TYPE.EQUALS),
      Factory.Token('stuff', 2, TOKEN_TYPE.IDENTIFIER),
      Factory.Token(' ', 2, TOKEN_TYPE.WHITESPACE),
      Factory.Token('"', 2, TOKEN_TYPE.DOUBLE_QUOTE),
      Factory.Token('quote', 2, TOKEN_TYPE.IDENTIFIER),
      Factory.Token('"', 2, TOKEN_TYPE.DOUBLE_QUOTE),
      Factory.Token(' ', 2, TOKEN_TYPE.WHITESPACE),
      Factory.Token('@????', 2, TOKEN_TYPE.IDENTIFIER),
      Factory.Token(TOKEN.NEWLINE, 2, TOKEN_TYPE.NEWLINE),
    ]);
  });

  it('flushes a lone $ as an identifier token', () => {
    const input = `$ something`;

    expect(new Lexer().tokenize(input)).toEqual([
      Factory.Token('$', 1, TOKEN_TYPE.IDENTIFIER),
      Factory.Token(' ', 1, TOKEN_TYPE.WHITESPACE),
      Factory.Token('something', 1, TOKEN_TYPE.IDENTIFIER),
    ]);
  });

  it('flushes a lone @ as an identifier token', () => {
    const input = `@ something`;

    expect(new Lexer().tokenize(input)).toEqual([
      Factory.Token('@', 1, TOKEN_TYPE.IDENTIFIER),
      Factory.Token(' ', 1, TOKEN_TYPE.WHITESPACE),
      Factory.Token('something', 1, TOKEN_TYPE.IDENTIFIER),
    ]);
  });

  it('flushes a lone & as an identifier token', () => {
    const input = `& something`;

    expect(new Lexer().tokenize(input)).toEqual([
      Factory.Token('&', 1, TOKEN_TYPE.IDENTIFIER),
      Factory.Token(' ', 1, TOKEN_TYPE.WHITESPACE),
      Factory.Token('something', 1, TOKEN_TYPE.IDENTIFIER),
    ]);
  });

  it('structural branch flushes pending content first', () => {
    const input = `?;`;
    expect(new Lexer().tokenize(input)).toEqual([
      Factory.Token('?', 1, TOKEN_TYPE.IDENTIFIER),
      Factory.Token(';', 1, TOKEN_TYPE.SEMICOLON),
    ]);
  });

  it('macro branch flushes pending content first', () => {
    const input = `?$macro`;
    expect(new Lexer().tokenize(input)).toEqual([
      Factory.Token('?', 1, TOKEN_TYPE.IDENTIFIER),
      Factory.Token('$macro', 1, TOKEN_TYPE.MACRO_REFERENCE),
    ]);
  });

  it('comment branch flushes pending content first', () => {
    const input = `?#a comment`;
    expect(new Lexer().tokenize(input)).toEqual([
      Factory.Token('?', 1, TOKEN_TYPE.IDENTIFIER),
      Factory.Token('#a comment', 1, TOKEN_TYPE.COMMENT),
    ]);
  });

  it('script branch flushes pending content first', () => {
    const input = `?#% script`;
    expect(new Lexer().tokenize(input)).toEqual([
      Factory.Token('?', 1, TOKEN_TYPE.IDENTIFIER),
      Factory.Token('#% script', 1, TOKEN_TYPE.SCRIPT),
    ]);
  });

  it('quote branch flushes pending content first', () => {
    const input = `?"quote"`;
    expect(new Lexer().tokenize(input)).toEqual([
      Factory.Token('?', 1, TOKEN_TYPE.IDENTIFIER),
      Factory.Token('"', 1, TOKEN_TYPE.DOUBLE_QUOTE),
      Factory.Token('quote', 1, TOKEN_TYPE.IDENTIFIER),
      Factory.Token('"', 1, TOKEN_TYPE.DOUBLE_QUOTE),
    ]);
  });

  it('identifier branch flushes pending content first', () => {
    const input = `?abc`;
    expect(new Lexer().tokenize(input)).toEqual([
      Factory.Token('?', 1, TOKEN_TYPE.IDENTIFIER),
      Factory.Token('abc', 1, TOKEN_TYPE.IDENTIFIER),
    ]);
  });

  it('whitespace branch flushes pending content first', () => {
    const input = `? abc`;
    expect(new Lexer().tokenize(input)).toEqual([
      Factory.Token('?', 1, TOKEN_TYPE.IDENTIFIER),
      Factory.Token(' ', 1, TOKEN_TYPE.WHITESPACE),
      Factory.Token('abc', 1, TOKEN_TYPE.IDENTIFIER),
    ]);
  });

  it('backspace - newline escaping branch flushes pending content first', () => {
    const input = `?\\
something`;
    expect(new Lexer().tokenize(input)).toEqual([
      Factory.Token('?', 1, TOKEN_TYPE.IDENTIFIER),
      Factory.Token('something', 2, TOKEN_TYPE.IDENTIFIER),
    ]);
  });

  it('document reference "&" branch flushes pending content first', () => {
    const input = `?&something`;
    expect(new Lexer().tokenize(input)).toEqual([
      Factory.Token('?', 1, TOKEN_TYPE.IDENTIFIER),
      Factory.Token('&something', 1, TOKEN_TYPE.DOCUMENT_REFERENCE),
    ]);
  });

  it('special attribute "@" branch flushes pending content first', () => {
    const input = `?@something`;
    expect(new Lexer().tokenize(input)).toEqual([
      Factory.Token('?', 1, TOKEN_TYPE.IDENTIFIER),
      Factory.Token('@something', 1, TOKEN_TYPE.SPECIAL_ATTRIBUTE),
    ]);
  });

  it.each([
    {
      name: 'semicolon',
      trigger: ';',
      expected: [Factory.Token(';', 1, TOKEN_TYPE.SEMICOLON)],
    },
    {
      name: 'macro reference',
      trigger: '$macro',
      expected: [Factory.Token('$macro', 1, TOKEN_TYPE.MACRO_REFERENCE)],
    },
    {
      name: 'document reference',
      trigger: '&ref',
      expected: [Factory.Token('&ref', 1, TOKEN_TYPE.DOCUMENT_REFERENCE)],
    },
    {
      name: 'special attribute',
      trigger: '@attr',
      expected: [Factory.Token('@attr', 1, TOKEN_TYPE.SPECIAL_ATTRIBUTE)],
    },
    {
      name: 'lone $ (no-macro path)',
      trigger: '$',
      expected: [Factory.Token('$', 1, TOKEN_TYPE.IDENTIFIER)],
    },
    {
      name: 'comment',
      trigger: '#a comment',
      expected: [Factory.Token('#a comment', 1, TOKEN_TYPE.COMMENT)],
    },
    {
      name: 'script',
      trigger: '#% script',
      expected: [Factory.Token('#% script', 1, TOKEN_TYPE.SCRIPT)],
    },
    {
      name: 'quote',
      trigger: '"quote"',
      expected: [
        Factory.Token('"', 1, TOKEN_TYPE.DOUBLE_QUOTE),
        Factory.Token('quote', 1, TOKEN_TYPE.IDENTIFIER),
        Factory.Token('"', 1, TOKEN_TYPE.DOUBLE_QUOTE),
      ],
    },
    {
      name: 'identifier',
      trigger: 'abc',
      expected: [Factory.Token('abc', 1, TOKEN_TYPE.IDENTIFIER)],
    },
    {
      name: 'whitespace',
      trigger: ' ',
      expected: [Factory.Token(' ', 1, TOKEN_TYPE.WHITESPACE)],
    },
    {
      name: 'backspace',
      trigger: `\\\nsomething`,
      expected: [Factory.Token('something', 2, TOKEN_TYPE.IDENTIFIER)],
    },
  ])(
    'ensures previous token block resets pending content before $name',
    ({ trigger, expected }) => {
      const PREFIX = '????????????';
      const input = `${PREFIX}${trigger}`;
      expect(new Lexer().tokenize(input)).toEqual([
        Factory.Token(PREFIX, 1, TOKEN_TYPE.IDENTIFIER),
        ...expected,
      ]);
    },
  );

  it('correctly parses characters immediately following a macro inside quotes', () => {
    // This input specifically tests that the lexer does NOT skip
    // the ':' after $macro1, and does NOT skip the closing "'" after $macro2.
    const input = `'$macro1:$macro2'`;

    expect(new Lexer().tokenize(input)).toEqual([
      Factory.Token("'", 1, TOKEN_TYPE.SINGLE_QUOTE),
      Factory.Token('$macro1', 1, TOKEN_TYPE.MACRO_REFERENCE),
      Factory.Token(':', 1, TOKEN_TYPE.IDENTIFIER), // Fails if missing continue;
      Factory.Token('$macro2', 1, TOKEN_TYPE.MACRO_REFERENCE),
      Factory.Token("'", 1, TOKEN_TYPE.SINGLE_QUOTE), // Fails if missing continue;
    ]);
  });

  it('correctly handles a lone dollar sign immediately before a closing quote', () => {
    const input = `"$"`;

    expect(new Lexer().tokenize(input)).toEqual([
      Factory.Token('"', 1, TOKEN_TYPE.DOUBLE_QUOTE),
      Factory.Token('$', 1, TOKEN_TYPE.IDENTIFIER),
      Factory.Token('"', 1, TOKEN_TYPE.DOUBLE_QUOTE),
    ]);
  });

  it('correctly handles a lone dollar sign followed by a non-macro character inside quotes', () => {
    const input = `"$ "`;

    expect(new Lexer().tokenize(input)).toEqual([
      Factory.Token('"', 1, TOKEN_TYPE.DOUBLE_QUOTE),
      Factory.Token('$ ', 1, TOKEN_TYPE.IDENTIFIER),
      Factory.Token('"', 1, TOKEN_TYPE.DOUBLE_QUOTE),
    ]);
  });

  it('escapes only newline with preceding backslash, which is kept otherwise', () => {
    const input = `\\r\\
something`;

    expect(new Lexer().tokenize(input)).toEqual([
      Factory.Token('\\', 1, TOKEN_TYPE.IDENTIFIER),
      Factory.Token('r', 1, TOKEN_TYPE.IDENTIFIER),
      Factory.Token('something', 2, TOKEN_TYPE.IDENTIFIER),
    ]);
  });

  it('flushes content before and after escaped newline', () => {
    const input = `????\\
?????something`;

    expect(new Lexer().tokenize(input)).toEqual([
      Factory.Token('????', 1, TOKEN_TYPE.IDENTIFIER),
      Factory.Token('?????', 2, TOKEN_TYPE.IDENTIFIER),
      Factory.Token('something', 2, TOKEN_TYPE.IDENTIFIER),
    ]);
  });

  it.skip('handles double quotes inside modifier values', () => {
    // uses double quotes for impex modifiers
    // https://github.com/productsupcom/nemeses-sap-hybris-cloud/blob/72a0f042890fe4227dba060549505551ccd31fd6/core-customize/productdataexportaccelerator/resources/impex/projectdata_sampleConfiguration_accelerator.impex#L19

    const input = `
UPDATE CSVExportCronJob;code[unique=true];urlResolutionProperties(code)[default="secure_electr"];
;ProductsupApiExport;
;ProductsupApiDeltaExport;
;ProductsupApiIncrementalExport;    
`;
  });

  it.skip('handles single quote inside modifier values ', () => {
    // impex source:
    // https://github.com/Worldpay/hybris/blob/37efd3edbdfdbf9d28ecdea8542e765a9ace296d/hybris/bin/y-ext/ext-worldpay/worldpayaddon/resources/worldpayaddon/import/common/user-groups.impex#L9

    const input = `
$passwordEncoding=md5
$defaultPassword=12341234
$setPassword=@password[translator=de.hybris.platform.impex.jalo.translators.ConvertPlaintextToEncodedUserPasswordTranslator][default='$passwordEncoding:$defaultPassword']
`;

    expect(new Lexer().tokenize(impex)).toEqual([
      //
    ]);
  });

  it.todo('handles userrights block');

  it.todo('handles crlf and lf newlines ending');

  it.todo('should handle unrecognized (stuff?)');
});

describe('Lexer - on real world impex', () => {
  it('tokenizes modifier with double quotes', () => {
    const input = `
INSERT_UPDATE AttributeFieldConfig;code[unique=true];fieldHeader;indexedAttributeDescriptorsInternal;fieldFormatterBean;fieldExtractorBean;productType(code);productCategory(catalogVersion(catalog(id),version),code)
;attr_additional_image;additional_image;Product.galleryImages[0].medias[0];acceleratorMediaFieldFormatter;attributeFieldExtractorStrategy;Product;
;attr_product_image;product_image;Product.picture;acceleratorMediaFieldFormatter;attributeFieldExtractorStrategy;Product;
;attr_age_group;age_group;Product.supercategories;acceleratorAgeGroupFormatter;attributeFieldExtractorStrategy;Product;

INSERT_UPDATE SelfReferenceFieldConfig;code[unique=true];fieldHeader;fieldFormatterBean;fieldExtractorBean;productType(code);productCategory(catalogVersion(catalog(id),version),code)
;self_product_url;product_url;acceleratorProductFieldFormatter;selfReferenceExtractorStrategy;Product;

INSERT_UPDATE CSVExportFieldConfigRelation;source(code)[unique=true];target(code)[unique=true]
;minimal;attr_product_image
;minimal;self_product_url
;ideal;attr_product_image
;ideal;self_product_url
;ideal;attr_age_group
;ideal;attr_additional_image

INSERT_UPDATE URLResolutionProperties;code[unique=true];encodingAttributes;subPath;secure;queryParameters;baseSite(uid)
;secure_electr;;;true;;electronics

UPDATE CSVExportCronJob;code[unique=true];urlResolutionProperties(code)[default="secure_electr"];
;ProductsupApiExport;
;ProductsupApiDeltaExport;
;ProductsupApiIncrementalExport;

# Separate import for testing purposes because default catalog has no products. If this fails however, it won't stop the 
# secure_electr from being added, thats why it's split.
UPDATE CSVExportCronJob;code[unique=true];catalogVersion(catalog(id),version);
;ProductsupApiExport;apparelProductCatalog:Online;
;ProductsupApiDeltaExport;apparelProductCatalog:Online;
;ProductsupApiIncrementalExport;apparelProductCatalog:Online;
`;

    expect(new Lexer().tokenize(input)).toMatchSnapshot();
  });

  it('tokenizes impex with userrights', () => {
    const input = `
$regulargroup=regulargroup
$customergroup=customergroup

$passwordEncoding=md5
$defaultPassword=12341234
$setPassword=@password[translator=de.hybris.platform.impex.jalo.translators.ConvertPlaintextToEncodedUserPasswordTranslator][default='$passwordEncoding:$defaultPassword']



$START_USERRIGHTS;;;;;;;;;
Type;UID;MemberOfGroups;Password;Target;read;change;create;remove;change_perm
UserGroup;cockpitgroup;;;;;;;;
;;;;WorldpayAPMConfiguration;+;+;+;+;+;
;;;;WorldpayCurrencyRange;+;+;+;+;+;
$END_USERRIGHTS;;;;;
`;

    expect(new Lexer().tokenize(input)).toMatchSnapshot();
  });
});
