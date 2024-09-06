import { describe, test, expect } from 'vitest';
import { parse } from './index.js';

describe('csv parser', () => {
    test('parses a normal csv', () => {
        const csv = [
            'id,firstName,lastName,quote',
            '42e9f,Linus,Torvalds,Talk is cheap. Show me the code.',
            '4f5e4,Joel,Spolsky,It’s harder to read code than to write it.',
        ].join('\n');

        const result = parse(csv);

        expect(result).toStrictEqual([
            {
                id: '42e9f',
                firstName: 'Linus',
                lastName: 'Torvalds',
                quote: 'Talk is cheap. Show me the code.',
            },
            {
                id: '4f5e4',
                firstName: 'Joel',
                lastName: 'Spolsky',
                quote: 'It’s harder to read code than to write it.',
            },
        ]);
    });

    test('ignores empty lines', () => {
        const csv = [
            'id,firstName,lastName,quote',
            '42e9f,Linus,Torvalds,Talk is cheap. Show me the code.',
            '',
        ].join('\n');

        const result = parse(csv);

        expect(result).toStrictEqual([
            {
                id: '42e9f',
                firstName: 'Linus',
                lastName: 'Torvalds',
                quote: 'Talk is cheap. Show me the code.',
            },
        ]);
    });

    test('parses a csv with spaces in header', () => {
        const csv = [
            'id,first name,last name,quote',
            '42e9f,Linus,Torvalds,Talk is cheap. Show me the code.',
        ].join('\n');

        const result = parse(csv);

        expect(result).toStrictEqual([
            {
                id: '42e9f',
                'first name': 'Linus',
                'last name': 'Torvalds',
                quote: 'Talk is cheap. Show me the code.',
            },
        ]);
    });
});
