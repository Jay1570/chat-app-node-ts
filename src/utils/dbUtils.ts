export function mapOneToMany<
    TRow,
    TParentKey extends keyof TRow,
    TChild,
    TChildrenKey extends string,
    TParent extends Record<TChildrenKey, TChild[]>,
>({
    rows,
    parentKey,
    createParent,
    createChild,
    childrenKey,
}: {
    rows: TRow[];
    parentKey: TParentKey;
    createParent: (row: TRow) => TParent;
    createChild: (row: TRow) => TChild | null;
    childrenKey: TChildrenKey;
}): TParent[] {
    const map = new Map<TRow[TParentKey], TParent>();

    for (const row of rows) {
        const key = row[parentKey];

        if (!map.has(key)) {
            const parent = createParent(row);
            map.set(key, parent);
        }

        const child = createChild(row);
        if (child) {
            map.get(key)?.[childrenKey].push(child);
        }
    }

    return Array.from(map.values());
}
