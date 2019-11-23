# Any Swap For VS Code

Swap parameters, lines, even complicated expressions from current cursor.

Behaves just like `Move-Element-Left/Right` in IntelliJ's IDEs, but more intelligently.
It is based on a general Abstract-Syntax-Tree (AST) analyzer that enables user to swap expressions recursively while maintaining a correct operator precedence.

## Features

Place your cursor (|) on the begin/end of a word/paren, then trigger the command to swap things.

**Parameters:**
```
func(a|, b)         => func(b, a|)         => func(|a, b)
func(int a|, int b) => func(int b, int a|) => func(|int a, int b)
```

**Lines:**
```
a|, b   =>  b, a|   =>  c, d
c, d        c, d        b, a|
```

**Math expressions:**
```
a| * b + c   => b * a| + c   => c + b * a|
(a| + b) * c => (b + a|) * c => c * (b + a)|
```

**Expressions with functions:**
```
func(a| + b, c) * d => func(b + a|, c) * d  => func(c, b + a|) * d   => d * func(c, b + a)|
```

**Expressions with nested functions:**
```
func(a().b(c| + d), f)  => func(a().b(d + c|), f)   => func(f, a().b(d + c)|)
```

**Logic expressions:**
```
a| and b or c   => b and a| or c    => c or b and a|
if a| and b 	=> if b and a|
```

**Array expressions:**
```
a[0|][1]        => a[1][0|]
a[b[c| + 1]][0] => a[b[1 + c|]][0] => a[0][b[1 + c]|]
```

**Statements:**
```
a = 1|; b = 2; 	=> b = 2; a = 1;|
return a|, b 	=> return b, a|
```

**Cross-line expressions:**
```
func(a|, => func(b,
    b)          a|)
```

## Release Notes

### 0.1.0

First publish.
