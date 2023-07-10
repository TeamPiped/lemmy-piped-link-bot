# Lemmy Piped Link Bot

## How to make it join a community

1. Send the bot a message with communities in the format `!community@instance.tld`. You can have multiple communities in one message.

2. The bot will join the communities and reply with a message containing the communities it joined.

## Where does it get the communities from?

The bot gets communities to reply to from the servers the Lemmy instance is federating with (has at least one user who is subscribed to that community). This currently is the `feddit.rocks` instance.

If more users use this instance, it will reply to more comments/posts.
