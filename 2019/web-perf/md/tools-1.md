## Web Performance Tips

- Migrate to HTTP/2. HTTP/2 addresses many performance problems inherent in HTTP/1.1, such as concurrent request limits and the lack of header compression
 - User preload
```
<link rel="preload" as="script" href="super-important.js">
<link rel="preload" as="style" href="critical.css">
```

- Code Splitting (webpack feature)
    - allows you to split your code into various bundles which can then be loaded on demand or in parallel. I
 - Minification
    -  compress redundant or unnecessary data is to eliminate it altogether. We can’t just delete arbitrary data, but in some contexts where we have content-specific knowledge of the data format and its properties, it's often possible to significantly reduce the size of the payload without affecting its actual meaning.

- Compress
    - minimize the overall download size by optimizing and compressing the remaining resources.
    - [Optimizing Encoding and Transfer Size of Text-Based Assets](https://developers.google.com/web/fundamentals/performance/optimizing-content-efficiency/optimize-encoding-and-transfer)



- Image optimization - [Automating image optimization](https://developers.google.com/web/fundamentals/performance/optimizing-content-efficiency/automating-image-optimization/)

- Replace Animated GIFs with Video [ref](https://developers.google.com/web/fundamentals/performance/optimizing-content-efficiency/replace-animated-gifs-with-video/)

### HTTP/2

- [Introduction to HTTP/2](https://developers.google.com/web/fundamentals/performance/http2/)
- [Resource Prioritization – Getting the Browser to Help You](
