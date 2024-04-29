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

This makes sure we only keep the values and discard the keys. The result is `["A", "B"]`.

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

Now, I *am* aware that the official PHP docs/spec very clearly [point out](https://www.php.net/manual/en/language.types.boolean.php) which values are considered falsy in a boolean context, but I just cannot make sense of it as someone with a Java background (a statically typed language). Like why would a string containing the number literal 0 would be falsy? Or why would an empty array be falsy?

In web dev, JavaScript and PHP are frequently paired and go hand in hand, so it's a bit of a mental shift for me when I see different dynamic behavior like this. Maybe it's just me though.

---

## 3. The string concatenation operator

PHP uses the `.` operator for string concatenation. This is a bit annoying to me because I'm so used to using `+` to concat in JavaScript, Java, Kotlin, Dart etc. I've lost count of the number of times I've written `+` instead of `.` in PHP and spent a good 5 minutes debugging why my code isn't working.

The worst part is PHP doesn't even throw an error when you use `+` for string concatenation. It just silently converts the strings to numbers and adds them together. So if you have a string like `"10"` and a number like `5`, PHP will happily convert the string to a number and add them together to give you `15`. 

PHP:
```php
echo "10" + 5; // 15
```

JavaScript:
```javascript
console.log("10" + 5); // "105"
```

The mental shift argument from the previous point applies here as well.

---

## 4. isset vs empty vs is_null

PHP has a gazillion ways to check if a variable is set or not, depending on what exactly you want to check. The three most common ways are `isset`, `empty`, and `is_null`.

<figure>

![isset-empty-is_null.png](/static/images/isset-empty-is_null.png)

<figcaption>

_A diagram showing the differences between `isset`, `empty`, and `is_null`, credit: [virendrachandak.com](https://www.virendrachandak.com/techtalk/php-isset-vs-empty-vs-is_null/)_

</figcaption>

</figure>

I'm going to be honest with you, I hate this with all my heart.

---

## 5. Arrow functions are single expression only

PHP 7.4 introduced [arrow functions](https://www.php.net/manual/en/functions.arrow.php) which are a great addition to the language. Not only do they allow for more concise syntax, but they also help with the infamous PHP variable scope issues. They automatically capture variables from the parent scope, which is a huge improvement over the `use` keyword in anonymous functions.

```php
$numbers = [1, 2, 3];
$multiplier = 2;

// Anonymous function (PHP < 7.4)
$multipliedNumbers = array_map(function ($number) use ($multiplier) {
    return $number * $multiplier;
}, $numbers);

// Arrow function (PHP >= 7.4)
$multipliedNumbers = array_map(
    fn($number) => $number * $multiplier, $numbers);
```

But, we can't _really_ have nice things, can we? There's a nasty little caveat with arrow functions in PHP: they can only contain a single expression. This means you can't have multiple statements in an arrow function, which is a bit of a bummer.

---

Last updated: 2024-04-30. I wonder how many additions I will make to this list in the future 🤔
