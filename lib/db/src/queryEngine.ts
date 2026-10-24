import { loadDatabase, saveDatabase } from "./storage";

export function getRecordValue(record: any, key: string): any {
  if (!record || typeof record !== "object") return undefined;
  if (record[key] !== undefined) return record[key];

  // Try camelCase
  const camel = key.replace(/_([a-z])/g, (_, g) => g.toUpperCase());
  if (record[camel] !== undefined) return record[camel];

  // Try snake_case
  const snake = key.replace(/[A-Z]/g, (l) => "_" + l.toLowerCase());
  if (record[snake] !== undefined) return record[snake];

  return undefined;
}

export function getTableName(table: any): string {
  if (!table) return "unknown";
  if (typeof table === "string") return table;

  const rawName =
    table[Symbol.for("drizzle:Name")] ||
    table._?.name ||
    table.name ||
    table[Symbol.for("drizzle:OriginalName")] ||
    "";

  if (rawName) return rawName;

  const str = String(table);
  if (str.includes("beneficiaries")) return "beneficiaries";
  if (str.includes("admins")) return "admins";
  if (str.includes("user_custom_phases") || str.includes("userCustomPhases")) return "user_custom_phases";
  if (str.includes("custom_phases") || str.includes("customPhases")) return "custom_phases";
  if (str.includes("financial_transactions") || str.includes("financialTransactions")) return "financial_transactions";
  if (str.includes("notifications")) return "notifications";
  if (str.includes("staff_users") || str.includes("staffUsers")) return "staff_users";

  return "unknown";
}

function extractColName(chunk: any): string | null {
  if (!chunk) return null;
  if (typeof chunk === "string") return chunk;
  if (chunk.name) return String(chunk.name);
  if (chunk.column?.name) return String(chunk.column.name);
  if (chunk._?.name) return String(chunk._.name);
  return null;
}

export function matchRecord(record: any, condition: any): boolean {
  if (!condition) return true;
  if (!condition.queryChunks || !Array.isArray(condition.queryChunks)) return true;

  const chunks = condition.queryChunks;

  // Single wrapped SQL subcondition: ( ... )
  const nestedSql = chunks.filter((c: any) => c && c.queryChunks && Array.isArray(c.queryChunks));
  if (nestedSql.length === 1 && chunks.length <= 3) {
    return matchRecord(record, nestedSql[0]);
  }

  // Check for logical AND / OR connectors in string chunks
  let hasAnd = false;
  let hasOr = false;
  for (const c of chunks) {
    if (c && Array.isArray(c.value) && typeof c.value[0] === "string") {
      const op = c.value[0].trim().toLowerCase();
      if (op === "and") hasAnd = true;
      if (op === "or") hasOr = true;
    }
  }

  if (hasAnd || hasOr) {
    const subConds = chunks.filter((c: any) => {
      if (!c) return false;
      if (Array.isArray(c.value) && typeof c.value[0] === "string") {
        const op = c.value[0].trim().toLowerCase();
        if (op === "and" || op === "or" || op === "(" || op === ")" || op === "") return false;
      }
      return true;
    });

    if (hasAnd) {
      return subConds.every((sub: any) => matchRecord(record, sub));
    }
    if (hasOr) {
      return subConds.some((sub: any) => matchRecord(record, sub));
    }
  }

  // Binary comparison: col = val
  let colName: string | null = null;
  let operator = "=";
  let targetVal: any = undefined;
  let hasTarget = false;

  for (const c of chunks) {
    if (!c) continue;
    if (c.name && c.table) {
      colName = c.name;
    } else if (Array.isArray(c.value) && typeof c.value[0] === "string") {
      const op = c.value[0].trim().toLowerCase();
      if (["=", "!=", "<>", ">", ">=", "<", "<=", "like", "ilike", "is", "is not"].includes(op)) {
        operator = op;
      }
    } else if (c.brand === "drizzle:Param" || (c.value !== undefined && !Array.isArray(c.value))) {
      targetVal = c.value;
      hasTarget = true;
    } else if (c.queryChunks) {
      return matchRecord(record, c);
    }
  }

  if (colName && hasTarget) {
    const recVal = getRecordValue(record, colName);

    if (targetVal === null) {
      if (operator === "is" || operator === "=") return recVal == null;
      if (operator === "is not" || operator === "!=" || operator === "<>") return recVal != null;
    }

    const strRec = String(recVal ?? "").trim();
    const strTgt = String(targetVal ?? "").trim();

    switch (operator) {
      case "!=":
      case "<>":
        return strRec.toLowerCase() !== strTgt.toLowerCase();
      case ">":
        return Number(recVal) > Number(targetVal);
      case ">=":
        return Number(recVal) >= Number(targetVal);
      case "<":
        return Number(recVal) < Number(targetVal);
      case "<=":
        return Number(recVal) <= Number(targetVal);
      case "like":
      case "ilike":
        return strRec.toLowerCase().includes(strTgt.toLowerCase().replace(/%/g, ""));
      case "=":
      default:
        return strRec.toLowerCase() === strTgt.toLowerCase();
    }
  }

  return true;
}

export function createQueryEngine() {
  const store = loadDatabase();

  function getTableStore(table: any): any[] {
    const name = getTableName(table);
    if (!store[name]) {
      store[name] = [];
    }
    return store[name];
  }

  function getNextId(list: any[]): number {
    let max = 0;
    for (const item of list) {
      if (typeof item.id === "number" && item.id > max) {
        max = item.id;
      }
    }
    return max + 1;
  }

  return {
    select(columns?: any) {
      let targetTable: any = null;
      let whereCondition: any = null;
      let limitCount: number | null = null;
      let offsetCount = 0;
      let orderParams: any[] = [];

      const builder = {
        from(table: any) {
          targetTable = table;
          return builder;
        },
        where(condition: any) {
          whereCondition = condition;
          return builder;
        },
        orderBy(...args: any[]) {
          orderParams = args;
          return builder;
        },
        limit(n: number) {
          limitCount = n;
          return builder;
        },
        offset(n: number) {
          offsetCount = n;
          return builder;
        },
        then(resolve: any) {
          const list = getTableStore(targetTable);
          let results = list.filter((item) => matchRecord(item, whereCondition));

          // Sorting
          if (orderParams.length > 0) {
            results.sort((a, b) => {
              for (const param of orderParams) {
                let colName: string | null = null;
                let isDesc = false;

                if (param) {
                  if (typeof param === "object") {
                    if (param.queryChunks) {
                      for (const c of param.queryChunks) {
                        const name = extractColName(c);
                        if (name) colName = name;
                        if (Array.isArray(c?.value) && c.value[0]?.toLowerCase().includes("desc")) isDesc = true;
                        if (typeof c === "string" && c.toLowerCase().includes("desc")) isDesc = true;
                      }
                    } else {
                      colName = extractColName(param);
                    }
                  } else if (typeof param === "string") {
                    colName = param;
                  }
                }

                if (colName) {
                  const valA = getRecordValue(a, colName);
                  const valB = getRecordValue(b, colName);

                  let comp = 0;
                  if (valA instanceof Date && valB instanceof Date) {
                    comp = valA.getTime() - valB.getTime();
                  } else if (typeof valA === "number" && typeof valB === "number") {
                    comp = valA - valB;
                  } else {
                    comp = String(valA ?? "").localeCompare(String(valB ?? ""));
                  }

                  if (comp !== 0) {
                    return isDesc ? -comp : comp;
                  }
                }
              }
              return 0;
            });
          }

          if (offsetCount > 0) {
            results = results.slice(offsetCount);
          }
          if (limitCount !== null) {
            results = results.slice(0, limitCount);
          }

          // Projection
          if (columns && typeof columns === "object" && !Array.isArray(columns) && Object.keys(columns).length > 0) {
            const keys = Object.keys(columns);
            results = results.map((item) => {
              const projected: any = {};
              for (const k of keys) {
                const colDef = columns[k];
                const colName = colDef && colDef.name ? colDef.name : k;
                const val = getRecordValue(item, colName) ?? getRecordValue(item, k);
                projected[k] = val;
              }
              return projected;
            });
          } else {
            results = results.map((item) => ({ ...item }));
          }

          return Promise.resolve(resolve(results));
        },
        catch(reject: any) {
          return Promise.resolve([]).catch(reject);
        },
      };
      return builder;
    },

    insert(table: any) {
      let insertedValues: any = null;

      const builder = {
        values(values: any) {
          insertedValues = values;
          return builder;
        },
        returning() {
          return builder;
        },
        then(resolve: any) {
          const list = getTableStore(table);
          const itemsToInsert = Array.isArray(insertedValues) ? insertedValues : [insertedValues];
          const results: any[] = [];

          for (const raw of itemsToInsert) {
            const newItem = {
              ...raw,
              id: raw.id !== undefined ? raw.id : getNextId(list),
              createdAt: raw.createdAt || new Date(),
              updatedAt: raw.updatedAt || new Date(),
            };
            list.push(newItem);
            results.push({ ...newItem });
          }

          saveDatabase(true);
          return Promise.resolve(resolve(results));
        },
        catch(reject: any) {
          return Promise.resolve([]).catch(reject);
        },
      };
      return builder;
    },

    update(table: any) {
      let setValues: any = {};
      let whereCondition: any = null;

      const builder = {
        set(values: any) {
          setValues = values;
          return builder;
        },
        where(condition: any) {
          whereCondition = condition;
          return builder;
        },
        returning() {
          return builder;
        },
        then(resolve: any) {
          const list = getTableStore(table);
          const updated: any[] = [];

          for (let i = 0; i < list.length; i++) {
            if (matchRecord(list[i], whereCondition)) {
              list[i] = {
                ...list[i],
                ...setValues,
                updatedAt: setValues.updatedAt || new Date(),
              };
              updated.push({ ...list[i] });
            }
          }

          if (updated.length > 0) {
            saveDatabase(true);
          }
          return Promise.resolve(resolve(updated));
        },
        catch(reject: any) {
          return Promise.resolve([]).catch(reject);
        },
      };
      return builder;
    },

    delete(table: any) {
      let whereCondition: any = null;

      const builder = {
        where(condition: any) {
          whereCondition = condition;
          return builder;
        },
        returning() {
          return builder;
        },
        then(resolve: any) {
          const tableName = getTableName(table);
          const list = store[tableName] || [];
          const remaining: any[] = [];
          const deleted: any[] = [];

          for (const item of list) {
            if (matchRecord(item, whereCondition)) {
              deleted.push({ ...item });
            } else {
              remaining.push(item);
            }
          }

          store[tableName] = remaining;
          if (deleted.length > 0) {
            saveDatabase(true);
          }
          return Promise.resolve(resolve(deleted));
        },
        catch(reject: any) {
          return Promise.resolve({ success: true }).catch(reject);
        },
      };
      return builder;
    },

    execute(_sql: any) {
      return Promise.resolve([]);
    },

    getStore() {
      return store;
    },
    saveNow() {
      saveDatabase(true);
    },
  };
}
