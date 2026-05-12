# Kafka Usage

Kafka is currently used for one background side effect: sending push notifications
through the Worker Service.

## Active Topic

| Topic | Producer | Consumer | Purpose |
|-------|----------|----------|---------|
| `notification.send` | Any backend service that needs async notification delivery | Worker Service | Looks up the user's registered Expo token and sends the message |

Old logging-only consumers such as `user.created`, `habit.completed`, and
`streak.updated` were removed because they did not affect product behavior.

## Message Shape

Publish a `notification.send` event with user info and a message:

```go
queue.Event{
    Type: "notification.send",
    Payload: notification.Job{
        User: notification.UserInfo{
            ID:    userID,
            Email: email,
            Role:  role,
        },
        Message: notification.Message{
            Title: "New reminder",
            Body:  "You have a DeenQuest update.",
            Data: map[string]interface{}{
                "url": "deenquest://my-profile",
            },
        },
    },
}
```

The worker handles token lookup. Callers should not need to know the Expo token.

## Worker Behavior

1. Consume `notification.send`.
2. Decode `{ user, message }`.
3. Find the latest active token for `user.id` in `notification_tokens`.
4. Send the notification through Expo.
5. Save the result in `job_logs`.

If the user has no registered token, the job is marked as `skipped` instead of
failing the worker.
