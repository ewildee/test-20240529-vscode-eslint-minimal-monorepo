# Test Markdown file to test ESLint code block linting

## JS

```js
import path from 'node:path';

const path = path.join('a/b/c', 'd'); // => 'a/b/c/d'
```

## TS

```ts
import path from 'node:path';

const path: string = path.join('a/b/c', 'd'); // => 'a/b/c/d'
```

