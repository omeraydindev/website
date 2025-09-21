---
title: "Comprehensive date guide: Managing dates in frontend, backend & DB"
date: "2024-06-18"
language: "en"
translationId: "kapsamli-date-rehberi"
categories:
  - "web"
  - "javascript"
  - "typescript"
---

In this article, I'll dive into how `Date`s should be managed in both frontend and backend. While these might seem like fundamental concepts, I see way too many incorrect implementations in the industry. So I'll start with an example scenario and try to demonstrate the proper [conventions](https://en.wikipedia.org/wiki/Coding_conventions) at each step. Hopefully, this will serve as a comprehensive guide.

For our example scenario, let's think of a reminder application. We'll have a very simple reminders table that stores the content of each reminder and information about when it should be triggered.

I'll go through this in reverse order: [Frontend](#frontend-layer) -> [Backend](#backend-layer) -> [DB](#database-layer), but feel free to jump to whichever section you need. There are also some bonuses at the end like DB optimizations.

## Database layer

On the database side, I'll be using MySQL since it's one of the most popular database systems out there. MySQL has [5 different](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-type-syntax.html) column types for storing date/time data:
- DATE
- DATETIME
- TIMESTAMP
- TIME
- YEAR

In our example application, we can store the trigger dates of reminders using `DATETIME`. For creation dates, we'll use `TIMESTAMP`. So what's the difference exactly?

- `TIMESTAMP` values are stored internally as UTC, but MySQL converts the output based on the `time_zone` of the connection when displaying values. For example, if `time_zone` is set to `'Europe/Istanbul'`, it will display the stored value with +3 hours added.

- `DATETIME` values are displayed exactly as they're stored, with no conversion done by the DBMS. This responsibility is left to the application using the database.

Generally speaking, TIMESTAMP is used to store the times when a record was INSERTed or UPDATEd in a table, like `created_at` or `updated_at` fields.

We use DATETIME for storing specific dates. It supports many additional date manipulation functions and is stored as 8 bytes instead of 4 bytes. (see [Year 2038 problem](https://en.wikipedia.org/wiki/Year_2038_problem))

Let's create our table like this:

```sql
CREATE TABLE reminders (
    id INT PRIMARY KEY AUTO_INCREMENT,
    content TEXT,
    trigger_date DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

We're going to insert a record, but we need to be careful that the `trigger_date` column receives a UTC date, so we need to INSERT a date that's 3 hours less than what we want. (We won't need to do this in actual code because `new Date().toISOString()` on the frontend side will already return UTC, not UTC+3.)

```sql
INSERT INTO reminders (content, trigger_date) 
VALUES ('Doctor appointment', '2024-06-19 06:00:00'); -- actually represents 9 AM
```

When we `SELECT` this record, the result we get (with `time_zone = 'SYSTEM'` set):

```
+----+--------------------+---------------------+---------------------+
| id | content            | trigger_date        | created_at          |
+----+--------------------+---------------------+---------------------+
|  1 | Doctor appointment | 2024-06-19 06:00:00 | 2024-06-18 18:53:36 |
+----+--------------------+---------------------+---------------------+
```

But when we set `time_zone = 'Europe/Istanbul'`:

```
+----+--------------------+---------------------+---------------------+
| id | content            | trigger_date        | created_at          |
+----+--------------------+---------------------+---------------------+
|  1 | Doctor appointment | 2024-06-19 06:00:00 | 2024-06-18 21:53:36 |
+----+--------------------+---------------------+---------------------+
```

As you can see, the `trigger_date` column wasn't transformed at all since it's `DATETIME`, but the `created_at` column got +3 hours added because it's `TIMESTAMP` and MySQL took the `time_zone` into account. The value stored in the column doesn't change; only MySQL's output for the query changes. This is really important to understand - we'll see why when we get to the frontend part.

## Backend layer

On this side, generally the thing we need to be careful about is not doing timezone operations directly. It makes more sense to work with UTC on the backend side. Because we don't plan to run our application only in a specific geography - we want it to be usable worldwide. If we start adding and subtracting 3 hours in our backend code, we'll just be overcomplicating things :)

Now I'm spinning up a simple Node.js application using [Bun](https://bun.sh/). Then I'll fill the `test-select.ts` file as follows:

```typescript
import mysql from "mysql2/promise";

const connection = await mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "password",
  database: "db",
});

const [results] = await connection.query(
  "SELECT * FROM reminders",
);
console.log(JSON.stringify(results, null, 2));

await connection.end();
```

When I run the code with `bun run test-select.ts`:

```json
[
  {
    "id": 1,
    "content": "Doctor appointment",
    "trigger_date": "2024-06-19T03:00:00.000Z",
    "created_at": "2024-06-18T15:53:36.000Z"
  }
]
```

Something seems wrong here. The dates have shifted quite a bit.

The reason for this is that the `mysql2` and `mysql` modules automatically [convert](https://github.com/mysqljs/mysql/issues/605#issuecomment-40168396) Date columns to JavaScript `Date` objects. JS naturally has its own timezone, so the dates get shifted. Rather than furthering this mistake, it would be better to turn off this behavior from the library. To do this, we just need to set the `dateStrings` argument to `true`:

```typescript
const connection = await mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "password",
  database: "db",
  dateStrings: true, // we added this
});
```

Now when I run it again:

```json
[
  {
    "id": 1,
    "content": "Doctor appointment",
    "trigger_date": "2024-06-19 06:00:00",
    "created_at": "2024-06-18 18:53:36"
  }
]
```

This time the result looks more correct. We wanted the trigger time to be 9 AM, since it's UTC it returned 6. The creation date was 21:53, since it's UTC we got 18:53 output. The backend has no knowledge of the locale being used.

The only thing missing is providing these dates to the frontend in [ISO 8601](https://en.wikipedia.org/wiki/ISO_8601) format. We can do this on the JS side or we can use the `DATE_FORMAT` function on the SQL side:

```sql
SELECT DATE_FORMAT(trigger_date, '%Y-%m-%dT%TZ') AS trigger_date,
       DATE_FORMAT(created_at, '%Y-%m-%dT%TZ') AS created_at
FROM reminders;
```

## Frontend layer

On the frontend side, what we need to do is actually quite simple. The backend sent us the UTC dates from the DB without manipulating them at all, and all we need to do is pass these ISO-formatted dates through `new Date()`. The rest will be handled by the user's browser according to their locale.

```typescript
const backendResponse = [
    {
        "trigger_date": "2024-06-19T06:00:00Z",
        "created_at": "2024-06-18T18:53:36Z"
    }
];
backendResponse.forEach((reminder) => {
    const triggerDate = new Date(reminder.trigger_date);
    const createdAt = new Date(reminder.created_at);
    console.log(triggerDate.toLocaleString());
    console.log(createdAt.toLocaleString());
});
```

Output:

```
19.06.2024 09:00:00
18.06.2024 21:53:36
```

As you can see, we didn't do anything related to locale in either the backend or the DB, and our dates look correct on the frontend. The dates were automatically converted according to the user's browser locale.

At this point, it's worth mentioning why we converted these dates to ISO format before sending them to the frontend. Because if we had sent them as-is in MySQL `DATETIME` format (e.g., `"2024-06-19 06:00:00"`), we would get incorrect date output when passing it through `new Date()` in JS. The browser would interpret this date according to its own locale and assume it's already UTC+3. By converting the date to ISO format, we actually guided the browser. The `Z` at the end of `"2024-06-19T06:00:00Z"` tells the browser that the date is in UTC.

---

Actually, that was the end of the article. But if you've read this far, let me give you a few more bonus tricks:

## "X days ago" style date displays

Generally, libraries like [moment](https://momentjs.com/) or [date-fns](https://date-fns.org/) are used for these types of displays, but that's not necessary. Modern JavaScript has a [blessing](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/RelativeTimeFormat) like `Intl.RelativeTimeFormat` - something that can be handled with 0 dependencies. I took the following example from a StackOverflow [answer](https://stackoverflow.com/a/72817357):

```typescript
function timeAgo(input: string | Date) {
  const date = input instanceof Date ? input : new Date(input);
  const formatter = new Intl.RelativeTimeFormat("en");
  const ranges = [
    ["years", 3600 * 24 * 365],
    ["months", 3600 * 24 * 30],
    ["weeks", 3600 * 24 * 7],
    ["days", 3600 * 24],
    ["hours", 3600],
    ["minutes", 60],
    ["seconds", 1],
  ] as const;
  const secondsElapsed = (date.getTime() - Date.now()) / 1000;

  for (const [rangeType, rangeVal] of ranges) {
    if (rangeVal < Math.abs(secondsElapsed)) {
      const delta = secondsElapsed / rangeVal;
      return formatter.format(Math.round(delta), rangeType);
    }
  }
}

console.log(timeAgo(new Date("2024-06-19T06:00:00Z")));
```

The output returns `in 10 hours` as of the date this article was published.

## Is my date query on the DB side too slow?

Let's say we have 10M records in our table and we want the count of records whose trigger time is in the year 2025. We took our precaution and first added an index to the trigger date:

```sql
CREATE INDEX trigger_date_index ON reminders (trigger_date);
```

Then we wrote a query like this:

```sql
SELECT COUNT(*)
FROM reminders
WHERE YEAR(trigger_date) = 2025;
```

But despite adding the index, the query takes more than 1 second. The reason for this is that the moment we use the `YEAR` function, MySQL can no longer use the index. This is a common mistake. Instead, we should change the query to this:

```sql
SELECT COUNT(*) 
FROM reminders 
WHERE trigger_date BETWEEN '2025-01-01' AND '2025-12-31';
```

When we run this query, we can tell it's using the index because it finishes in 0.03 seconds.

---

I hope this guide has been helpful. The conventions I've described here aren't rigid rules that must always be followed - there will always be exceptional cases, but learning the right way and weighing options accordingly is important. If you want to learn more about this topic specifically for the web, you can check out the [Intl](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl) and [Date](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date) documentation.
