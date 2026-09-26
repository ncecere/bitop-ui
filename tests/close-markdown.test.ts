import { closeMarkdown } from "@/registry/bitop/ui/response/close-markdown";

describe("closeMarkdown", () => {
  it.each([
    // complete input is unchanged
    ["Plain text.", "Plain text."],
    ["**bold** and *em* and `code`", "**bold** and *em* and `code`"],
    ["[link](https://example.com) done", "[link](https://example.com) done"],
    ["", ""],
    // fences
    ["```ts\nconst a = 1;", "```ts\nconst a = 1;\n```"],
    ["```ts\nconst a = 1;\n", "```ts\nconst a = 1;\n```"],
    ["~~~\nx", "~~~\nx\n~~~"],
    ["````md\n```\ninner", "````md\n```\ninner\n````"],
    ["```\na\n```\n\nThen **bo", "```\na\n```\n\nThen **bo**"],
    ["```py\nx = '**not emphasis'", "```py\nx = '**not emphasis'\n```"],
    // inline code
    ["Run `npm i", "Run `npm i`"],
    ["Run `", "Run "],
    ["Use ``a ` b", "Use ``a ` b``"],
    ["`**` stays", "`**` stays"],
    // emphasis
    ["This is **bold", "This is **bold**"],
    ["This is *em", "This is *em*"],
    ["This is _em", "This is _em_"],
    ["This is __strong", "This is __strong__"],
    ["This is ~~gone", "This is ~~gone~~"],
    ["***both", "***both***"],
    ["**bold *and em", "**bold *and em***"],
    ["**bold** then *em", "**bold** then *em*"],
    ["trailing space **bold ", "trailing space **bold**"],
    ["Opener only **", "Opener only "],
    ["**bold `code", "**bold `code`**"],
    // not emphasis
    ["snake_case_name", "snake_case_name"],
    ["2 * 3 = 6", "2 * 3 = 6"],
    ["* list item", "* list item"],
    ["- item\n- another *em", "- item\n- another *em*"],
    ["escaped \\*star", "escaped \\*star"],
    // links, images, citations
    ["See [the docs](https://exa", "See the docs"],
    ["See [the **docs**](https://exa", "See the **docs**"],
    ["See [the docs", "See the docs"],
    ["See [the docs]", "See [the docs]"],
    ["![chart](https://img", ""],
    ["Revenue grew [1", "Revenue grew "],
    ["Revenue grew [1, 2", "Revenue grew "],
    ["Revenue grew [1]", "Revenue grew [1]"],
    ["- [ ] task", "- [ ] task"],
    // only the last block is touched
    ["Para *one\n\nPara **two", "Para *one\n\nPara **two**"],
  ])("%j → %j", (input, expected) => {
    expect(closeMarkdown(input)).toBe(expected);
  });

  it("is idempotent on its own output", () => {
    for (const s of ["This is **bold", "```ts\nx", "See [a](https://b", "Run `x"]) {
      expect(closeMarkdown(closeMarkdown(s))).toBe(closeMarkdown(s));
    }
  });

  it("never throws on any prefix of a realistic answer", () => {
    const answer =
      "## Summary\n\nThe **2024 report** shows *growth* of `12%` [1]. See [the table](https://example.com/t?a=1_b) below.\n\n| Year | Growth |\n| --- | --- |\n| 2024 | 12% |\n\n```ts\nconst x = `template ${1}`;\n```\n\n1. First\n2. ~~Second~~ Third [2, 3]\n";
    for (let n = 0; n <= answer.length; n++) expect(() => closeMarkdown(answer.slice(0, n))).not.toThrow();
    expect(closeMarkdown(answer)).toBe(answer);
  });
});
