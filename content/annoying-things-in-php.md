---
title: "A non-exhaustive list of things I find annoying in PHP"
date: "2024-04-23"
categories: 
  - "english"
  - "php"
---

In my day-to-day job I occasionally have to write PHP which I *really* don't like, have never liked, and probably never will. *Why* I don't like PHP is a topic for another post (albeit it might be a bit controversial). So... here's a list of things I find annoying in PHP.

(The list is non-exhaustive - I might add more things to it from time to time.)

---

## 1. array_unique

[array_unique](https://www.php.net/manual/en/function.array-unique.php) is a function that "removes duplicate values from an array". Sounds simple enough, right? Surely this harmless little utility function cannot possibly do something that silently break production one day?

Welp, boy was I wrong :-)

```php
$list1 = ["A"];
$list2 = ["A", "B"];
$list3 = array_unique(array_merge($list1, $list2));
echo json_encode($list3);
```

What do you think this code prints?

If you thought: well, that's easy, it should print `["A", "B"]`, I have some [news](https://onlinephp.io/c/e9b4d) for you, because it prints `{"0":"A", "2":"B"}` 😮

In hindsight, the reason behind this behavior is actually very clearly pointed out in the [official docs](https://www.php.net/manual/en/function.array-unique.php):
> Note that keys are preserved. If multiple elements compare equal under the given flags, then the key and value of the first equal element will be retained.

The `array_merge` call results in `["A", "A", "B"]` as one can imagine, but if you think about how arrays work in PHP, that is really just `{0: "A", 1: "A", 2: "B"}`. So when you call `array_unique` on that result, it will keep the first occurrence of the value `"A"` and discard the second one. The result is `{"0":"A", "2":"B"}` and a broken production 😅

The fix is to simply wrap the `array_unique` call with `array_values`:
```php
$list3 = array_values(array_unique(array_merge($list1, $list2)));
```

---

## 2. The string "0" is falsy

This one is probably one of the biggest pain points of PHP for me. The code below doesn't print anything in PHP.

```php
$someStr = "0";
if ($someStr) {
    echo "foo"; // This line is never run
}
```

The equivalent JS code on the other hand...

```javascript
const someStr = "0";
if (someStr) {
    console.log("foo"); // This line runs
}
```

Now, I *am* aware that the official PHP docs/spec very clearly [point out](https://www.php.net/manual/en/language.types.boolean.php) which values are considered falsy in a boolean context, but I just cannot make sense of it as someone with a Java background (a statically typed language). Like why would a string containing the number literal 0 would be falsy? Or an empty array.

In web dev, JavaScript and PHP are frequently paired and go hand in hand, so it's a bit of a mental shift for me when I see different dynamic behavior like this. Maybe it's just me though.

---
