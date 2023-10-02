import { UrlLink, getPipedLinks } from "./utils";

describe("getPipedLinks", () => {
    it("should return an empty array if no links", () => {
        expect(getPipedLinks("")).toEqual([]);
    });

    it("should return an empty array if no YouTube links", () => {
        const text = "Check out this website: [example](https://example.com)";
        expect(getPipedLinks(text)).toEqual([]);
    });

     it("should not convert links when talking about the toplevel domain", () => {
         const text = "I like piped.video! I don't like youtube.com :(";
         const expected = [];
         expect(getPipedLinks(text)).toEqual(expected);
     });

     it("should convert the text content of YouTube links", () => {
         const text = "Watch this video: [https://youtube.com/watch?v=dQw4w9WgXcQ](https://youtube.com/watch?v=dQw4w9WgXcQ)";
         const expected = [new UrlLink("https://piped.video/watch?v=dQw4w9WgXcQ", "https://piped.video/watch?v=dQw4w9WgXcQ")];
         expect(getPipedLinks(text)).toEqual(expected);
     });

    it("should return piped video links if YouTube links", () => {
        const text = "Watch this video: [Rickroll](https://youtube.com/watch?v=dQw4w9WgXcQ)";
        const expected = [new UrlLink("Rickroll", "https://piped.video/watch?v=dQw4w9WgXcQ")];
        expect(getPipedLinks(text)).toEqual(expected);
    });

    it("should convert all types of YouTube links", () => {
        const text = `[Link 1](https://youtube.com/watch?v=dQw4w9WgXcQ)
      [Link 2](https://www.youtube.com/watch?v=dQw4w9WgXcQ)
      [Link 3](https://youtube-nocookie.com/watch?v=dQw4w9WgXcQ)
      [Link 4](https://youtu.be/dQw4w9WgXcQ)`;
        const expected = [
            new UrlLink("Link 1", "https://piped.video/watch?v=dQw4w9WgXcQ"),
            new UrlLink("Link 2", "https://piped.video/watch?v=dQw4w9WgXcQ"),
            new UrlLink("Link 3", "https://piped.video/watch?v=dQw4w9WgXcQ"),
            new UrlLink("Link 4", "https://piped.video/dQw4w9WgXcQ"),
        ];
        expect(getPipedLinks(text)).toEqual(expected);
    });
});
