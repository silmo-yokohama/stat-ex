/**
 * テスト用 Supabase モッククライアント
 *
 * モックデータを使って Supabase のクエリビルダーをシミュレートする。
 * from → select → eq/like/not → order → limit → single のチェーンに対応。
 */

import {
  mockGames,
  mockBoxScores,
  mockPlayers,
  mockPlayerSeasons,
  mockTeams,
  mockTeamStats,
  mockStandings,
  mockH2HRecords,
  mockInjuries,
  mockNews,
  mockVideos,
  mockMascot,
  mockGameComments,
  mockSeason,
} from "@/lib/mock-data";

// ================================================
// テーブルデータ（テーブル名 → モックデータ配列）
// ================================================

const TABLE_DATA: Record<string, unknown[]> = {
  games: mockGames,
  box_scores: mockBoxScores,
  players: mockPlayers,
  player_seasons: mockPlayerSeasons,
  teams: mockTeams,
  team_stats: [mockTeamStats],
  standings: mockStandings,
  h2h_records: mockH2HRecords,
  injuries: mockInjuries,
  news: mockNews,
  videos: mockVideos,
  mascot: [mockMascot],
  game_comments: mockGameComments,
  seasons: [mockSeason],
};

// ================================================
// JOIN 定義・パース
// ================================================

interface JoinDef {
  alias: string;
  tableName: string;
  fkColumn: string | null;
  isInner: boolean;
  nestedSelect: string;
}

/**
 * トップレベルのカンマで分割する（括弧内のカンマは無視）
 */
function splitTopLevel(str: string): string[] {
  const parts: string[] = [];
  let current = "";
  let depth = 0;
  for (const char of str) {
    if (char === "(") depth++;
    else if (char === ")") depth--;
    if (char === "," && depth === 0) {
      parts.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
}

/**
 * SELECT文字列の1パートからJOIN定義を抽出する
 *
 * 対応形式:
 *   alias:table!fk(subselect)
 *   alias:table!inner(subselect)
 *   table!inner(subselect)
 *   table(subselect)
 */
function parseJoinPart(part: string): JoinDef | null {
  const parenStart = part.indexOf("(");
  if (parenStart === -1) return null;

  const prefix = part.substring(0, parenStart);
  const subselect = part.substring(parenStart + 1, part.lastIndexOf(")"));

  const colonIdx = prefix.indexOf(":");
  let alias: string;
  let tableAndMods: string;

  if (colonIdx !== -1) {
    alias = prefix.substring(0, colonIdx);
    tableAndMods = prefix.substring(colonIdx + 1);
  } else {
    tableAndMods = prefix;
    alias = "";
  }

  const bangParts = tableAndMods.split("!");
  const tableName = bangParts[0];
  let isInner = false;
  let fkColumn: string | null = null;

  for (const mod of bangParts.slice(1)) {
    if (mod === "inner") isInner = true;
    else if (mod.length > 0) fkColumn = mod;
  }

  if (!alias) alias = tableName;
  return { alias, tableName, fkColumn, isInner, nestedSelect: subselect };
}

/**
 * SELECT文字列からJOIN定義リストを抽出する
 */
function parseJoins(selectStr: string): JoinDef[] {
  return splitTopLevel(selectStr)
    .map(parseJoinPart)
    .filter((j): j is JoinDef => j !== null);
}

// ================================================
// JOIN 解決
// ================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;

/**
 * 複数のJOINを順番に解決する
 */
function resolveJoins(rows: Row[], parentTable: string, joins: JoinDef[]): Row[] {
  let result = rows.map((r) => ({ ...r }));
  for (const join of joins) {
    result = resolveOneJoin(result, parentTable, join);
  }
  return result;
}

/**
 * 1つのJOINを解決する
 *
 * Forward FK: 親テーブルがFK列を持つ（1対1）
 * Reverse FK: 子テーブルがFK列を持つ（1対多）
 */
function resolveOneJoin(rows: Row[], parentTable: string, join: JoinDef): Row[] {
  const joinedData = (TABLE_DATA[join.tableName] || []) as Row[];
  const nestedJoins = parseJoins(join.nestedSelect);

  // FK列の特定（Forward FK: 親テーブル上のFK列）
  let fkOnParent: string | null = null;
  if (join.fkColumn && rows.length > 0 && join.fkColumn in rows[0]) {
    fkOnParent = join.fkColumn;
  }
  if (!fkOnParent && rows.length > 0) {
    for (const c of [`${join.alias}_id`, `${join.tableName.replace(/s$/, "")}_id`]) {
      if (c in rows[0]) {
        fkOnParent = c;
        break;
      }
    }
  }

  if (fkOnParent) {
    // Forward FK: parent[fk] → joined.id（1対1）
    const fk = fkOnParent;
    return rows
      .map((row) => {
        let joined = joinedData.find((j) => j.id === row[fk]);
        if (!joined) {
          return join.isInner ? null : { ...row, [join.alias]: null };
        }
        joined = { ...joined };
        if (nestedJoins.length > 0) {
          const resolved = resolveJoins([joined], join.tableName, nestedJoins);
          joined = resolved.length > 0 ? resolved[0] : undefined;
          if (!joined && join.isInner) return null;
        }
        return { ...row, [join.alias]: joined };
      })
      .filter((r): r is Row => r !== null);
  }

  // Reverse FK: joined[parentSingular_id] → parent.id（1対多）
  const reverseFk = `${parentTable.replace(/s$/, "")}_id`;
  return rows
    .map((row) => {
      let matched = joinedData.filter((j) => j[reverseFk] === row.id).map((j) => ({ ...j }));
      if (nestedJoins.length > 0) {
        matched = resolveJoins(matched, join.tableName, nestedJoins);
      }
      if (join.isInner && matched.length === 0) return null;
      return { ...row, [join.alias]: matched };
    })
    .filter((r): r is Row => r !== null);
}

// ================================================
// フィルタ
// ================================================

interface Filter {
  type: "eq" | "like" | "not";
  column: string;
  value: unknown;
  operator?: string;
}

/**
 * 単一行に対してフィルタ条件を判定する
 */
function matchFilter(row: Row, filter: Filter): boolean {
  const value = row[filter.column];
  switch (filter.type) {
    case "eq":
      return value === filter.value;
    case "like": {
      if (typeof value !== "string" || typeof filter.value !== "string") return false;
      const pattern = filter.value.replace(/%/g, ".*").replace(/_/g, ".");
      return new RegExp(`^${pattern}$`).test(value);
    }
    case "not":
      if (filter.operator === "is" && filter.value === null) {
        return value !== null && value !== undefined;
      }
      return value !== filter.value;
    default:
      return true;
  }
}

/**
 * ドット表記フィルタを適用する（JOINデータ対象）
 *
 * 例: "player_seasons.is_active" → JOINされた player_seasons 配列をフィルタ
 * 例: "game.season_id" → JOINされた game オブジェクトでフィルタ
 */
function applyDotFilter(rows: Row[], filter: Filter): Row[] {
  const dotIdx = filter.column.indexOf(".");
  const joinAlias = filter.column.substring(0, dotIdx);
  const rest = filter.column.substring(dotIdx + 1);

  return rows
    .map((row) => {
      const joined = row[joinAlias];
      if (Array.isArray(joined)) {
        // 配列（Reverse FK）: 条件に合う要素のみ残す
        const filtered = rest.includes(".")
          ? applyDotFilter(joined, { ...filter, column: rest })
          : joined.filter((item: Row) => matchFilter(item, { ...filter, column: rest }));
        return { ...row, [joinAlias]: filtered };
      }
      if (joined && typeof joined === "object") {
        // オブジェクト（Forward FK）: 条件に合わなければ行ごと除外
        if (rest.includes(".")) {
          const nested = applyDotFilter([joined], { ...filter, column: rest });
          if (nested.length === 0) return null;
          return { ...row, [joinAlias]: nested[0] };
        }
        return matchFilter(joined, { ...filter, column: rest }) ? row : null;
      }
      return null;
    })
    .filter((r): r is Row => r !== null);
}

/**
 * フィルタリストを適用する
 */
function applyFilters(rows: Row[], filters: Filter[]): Row[] {
  let result = rows;
  for (const f of filters) {
    result = f.column.includes(".")
      ? applyDotFilter(result, f)
      : result.filter((row) => matchFilter(row, f));
  }
  return result;
}

// ================================================
// ソート
// ================================================

interface OrderSpec {
  column: string;
  ascending: boolean;
}

/**
 * 行をソートする
 */
function applyOrdering(rows: Row[], orders: OrderSpec[]): Row[] {
  if (orders.length === 0) return rows;
  return [...rows].sort((a, b) => {
    for (const o of orders) {
      // "game(game_date)" → "game_date" のように括弧を除去
      const col = o.column.includes("(") ? o.column.replace(/.*\(|\)/g, "") : o.column;
      const va = a[col];
      const vb = b[col];
      if (va === vb) continue;
      if (va == null) return o.ascending ? -1 : 1;
      if (vb == null) return o.ascending ? 1 : -1;
      const cmp = va < vb ? -1 : 1;
      return o.ascending ? cmp : -cmp;
    }
    return 0;
  });
}

// ================================================
// MockQueryBuilder
// ================================================

/**
 * Supabase クエリビルダーのモック
 *
 * チェーン可能なAPIで、await 時にモックデータからクエリ結果を生成する。
 */
class MockQueryBuilder {
  private tableName: string;
  private selectStr = "*";
  private filters: Filter[] = [];
  private orders: OrderSpec[] = [];
  private limitCount: number | null = null;
  private isSingle = false;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  select(columns: string) {
    this.selectStr = columns;
    return this;
  }

  eq(column: string, value: unknown) {
    this.filters.push({ type: "eq", column, value });
    return this;
  }

  like(column: string, pattern: string) {
    this.filters.push({ type: "like", column, value: pattern });
    return this;
  }

  not(column: string, operator: string, value: unknown) {
    this.filters.push({ type: "not", column, value, operator });
    return this;
  }

  order(column: string, options?: { ascending?: boolean }) {
    this.orders.push({ column, ascending: options?.ascending ?? true });
    return this;
  }

  limit(count: number) {
    this.limitCount = count;
    return this;
  }

  single() {
    this.isSingle = true;
    return this;
  }

  /** クエリを実行して結果を返す */
  private execute(): { data: unknown; error: unknown } {
    const baseData = (TABLE_DATA[this.tableName] || []) as Row[];
    let rows = baseData.map((r) => ({ ...r }));

    // JOIN 解決
    const joins = parseJoins(this.selectStr);
    if (joins.length > 0) {
      rows = resolveJoins(rows, this.tableName, joins);
    }

    // ドット表記フィルタ（JOINデータ対象）を先に適用
    const dotFilters = this.filters.filter((f) => f.column.includes("."));
    const normalFilters = this.filters.filter((f) => !f.column.includes("."));

    if (dotFilters.length > 0) {
      rows = applyFilters(rows, dotFilters);
    }

    // INNER JOIN で空になった行を除外
    for (const join of joins) {
      if (join.isInner) {
        rows = rows.filter((row) => {
          const d = row[join.alias];
          return Array.isArray(d) ? d.length > 0 : d != null;
        });
      }
    }

    // 通常フィルタ適用
    if (normalFilters.length > 0) {
      rows = applyFilters(rows, normalFilters);
    }

    // ソート → リミット
    rows = applyOrdering(rows, this.orders);
    if (this.limitCount !== null) rows = rows.slice(0, this.limitCount);

    // single: 1件を返す
    if (this.isSingle) {
      if (rows.length === 0) {
        return { data: null, error: { message: "No rows found", code: "PGRST116" } };
      }
      return { data: rows[0], error: null };
    }

    return { data: rows, error: null };
  }

  /** PromiseLike 実装（await 対応） */
  then<T1 = { data: unknown; error: unknown }, T2 = never>(
    onfulfilled?: ((v: { data: unknown; error: unknown }) => T1 | PromiseLike<T1>) | null,
    onrejected?: ((r: unknown) => T2 | PromiseLike<T2>) | null
  ): Promise<T1 | T2> {
    try {
      const result = this.execute();
      return Promise.resolve(result).then(onfulfilled, onrejected);
    } catch (error) {
      return onrejected ? Promise.resolve(onrejected(error)) : Promise.reject(error);
    }
  }
}

// ================================================
// エクスポート
// ================================================

/**
 * テスト用モック Supabase クライアントを生成する
 */
export function createMockSupabaseClient() {
  return {
    from: (table: string) => new MockQueryBuilder(table),
  };
}
