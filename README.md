# slash-think

slash-think is a simple slack integration meant to run within the webtask.io framework.  It needs to be registered as an old-style webhook for a slash command called `/think` (with the security token stored in the webtask.io Secret Store as `WEBHOOK_SECRET`).  It also needs a slack Incoming Webhook registered to send its response to, the URL for which needs to be configured in the webtask.io Meta Store as `INCOMING_WEBHOOK_URL`. 

For all that, you get a new slack /think [message] command, that when used, displays a text-based thought bubble with whatever message it was given.  So:

```
/think I am thinking!
```

becomes

```
username
. o O ( I am thinking! )
```

That's all it does.  The only reason for the Incoming Webhook is because you can't pretend to be another user in a slash-command response, but you can with an incoming webhook.  (Sort of.)
