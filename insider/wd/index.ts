/*
Input:
```
id,firstName,lastName,quote
42e9f,Linus,Torvalds,Talk is cheap. Show me the code.

4f5e4,Joel,Spolsky,It’s harder to read code than to write it.
```

Expected output:
[
    {
        id: '42e9f',
        firstName: 'Linus',
        lastName: 'Torvalds',
        quote: 'Talk is cheap. Show me the code.'
    },
    {
        id: '4f5e4',
        firstName: 'Joel',
        lastName: 'Spolsky',
        quote: 'It’s harder to read code than to write it.'
    }
]
*/

export const parse = (csv: string) => {
    // ...
};
