import { LemmyBot } from "lemmy-bot";

const findYoutubeLinks = (text: string): string[] => {
    const regex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com|youtu\.?be)\/([\w?&=-]+)/gm;

    const matches = text.matchAll(regex);

    if (matches) {
        return Array.from(matches, m => `https://piped.video/${m[1]}`);
    }

    return [];
};

const generateLinkMessage = (links: string[]): string => {
    return `Here is an alternative Piped link(s): ${links.join(
        "\n\n",
    )}\n\nPiped is a privacy-respecting open-source alternative frontend to YouTube.\n\nI'm open-source, check me out at [GitHub](https://github.com/TeamPiped/lemmy-piped-link-bot).`;
};

const username = process.env.USERNAME || "PipedLinkBot";
const password = process.env.PASSWORD;

if (!password) {
    throw new Error("No password provided");
}

const bot = new LemmyBot({
    instance: process.env.INSTANCE || "feddit.rocks",
    credentials: {
        username: username,
        password: password,
    },
    federation: "all",
    dbFile: "db.sqlite3",
    handlers: {
        comment: {
            handle: ({
                commentView: {
                    comment: { content, id, post_id },
                },
                botActions: { createComment },
            }) => {
                if (content) {
                    const youtubeLinks = findYoutubeLinks(content);
                    if (youtubeLinks.length > 0) {
                        // create a comment on the post
                        createComment({
                            post_id: post_id,
                            parent_id: id,
                            content: generateLinkMessage(youtubeLinks),
                        });
                    }
                }
            },
            sort: "New",
        },
        post: {
            handle: ({
                postView: {
                    post: { id, url, body },
                },
                botActions: { createComment },
            }) => {
                const links: string[] = [];
                if (url) {
                    const urlObj = new URL(url);
                    // check if the url is a youtube video
                    if (
                        urlObj.hostname.endsWith(".youtube.com") ||
                        urlObj.hostname === "youtube.com" ||
                        urlObj.hostname === "youtube-nocookie.com" ||
                        urlObj.hostname === "youtu.be"
                    ) {
                        urlObj.hostname = "piped.video";
                        links.push(urlObj.toString());
                    }
                }
                if (body) {
                    const youtubeLinks = findYoutubeLinks(body);
                    links.push(...youtubeLinks);
                }

                if (links.length > 0) {
                    // create a comment on the post
                    createComment({
                        post_id: id,
                        content: generateLinkMessage(links),
                    });
                }
            },
            sort: "New",
        },
    },
});

bot.start();
