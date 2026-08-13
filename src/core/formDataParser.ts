type FormDataValue = string | File;

const DANGEROUS_KEYS = new Set(["__proto__", "constructor", "prototype"]);

function setNestedValue(
    target: Record<string, unknown>,
    path: string[],
    value: FormDataValue,
): void {
    if (path.some((segment) => DANGEROUS_KEYS.has(segment))) {
        throw new TypeError(
            `Disallowed key in form data path: ${path.join(".")}`,
        );
    }

    let current: Record<string, unknown> = target;

    for (let i = 0; i < path.length - 1; i++) {
        const key = path[i]!;
        const nextKey = path[i + 1]!;
        // "" marks an empty-bracket segment, e.g. items[] -> ["items", ""]
        const nextIsArrayIndex = nextKey === "" || /^\d+$/.test(nextKey);

        if (!Object.prototype.hasOwnProperty.call(current, key)) {
            current[key] = nextIsArrayIndex ? [] : {};
        }

        const next = current[key];
        if (typeof next !== "object" || next === null) {
            throw new TypeError(
                `Conflicting form data shape at "${key}": expected object/array, got ${typeof next}`,
            );
        }

        current = next as Record<string, unknown>;
    }

    const lastKey = path[path.length - 1]!;

    // Empty-bracket leaf, e.g. "tags[]" -> path ends in "" -> always push
    if (lastKey === "") {
        if (!Array.isArray(current)) {
            throw new TypeError(
                `Conflicting form data shape: expected array for "[]" syntax`,
            );
        }
        (current as unknown as unknown[]).push(value);
        return;
    }

    if (Object.prototype.hasOwnProperty.call(current, lastKey)) {
        const existing = current[lastKey];
        if (Array.isArray(existing)) {
            existing.push(value);
        } else {
            current[lastKey] = [existing, value];
        }
    } else {
        current[lastKey] = value;
    }
}

export function parseFormData(formData: FormData): unknown {
    const result: Record<string, unknown> = {};

    for (const [key, value] of formData.entries()) {
        // Keep empty bracket segments (e.g. "tags[]") instead of dropping them
        const path = key.match(/[^.[\]]+|(?<=\[)(?=\])/g);

        if (!path?.length) {
            continue;
        }

        setNestedValue(result, path, value);
    }

    return result;
}
