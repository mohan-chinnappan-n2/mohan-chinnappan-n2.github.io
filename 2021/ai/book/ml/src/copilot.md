# [GitHub Copilot](https://copilot.github.com/)

When we type this:
```js
function calculateDaysBetweenDates(date1, date2) {

```

Copilot will complete this function:

```js
 
function calculateDaysBetweenDates(date1, date2) {

  // following lines are written by copilot
  var oneDay = 24 * 60 * 60 * 1000;
  var date1InMillis = date1.getTime();
  var date2InMillis = date2.getTime();
  var days = Math.round(Math.abs(date2InMillis - date1InMillis) / oneDay);
  return days;
}


```

\\( \int x dx = \frac{x^2}{2} + C \\)

\\( \int y dy = \frac{y^3}{5} \\)
