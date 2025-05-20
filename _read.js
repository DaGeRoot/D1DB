/*
  Dage Party D1DB(cloudfalre workers)
  read data from database; 
*/

// ⚠️ WARNING: CHANGE THE DEFAULT TOKEN BEFORE DEPLOYMENT! ⚠️
// ⚠️ 警告：请在部署前更改默认令牌！
// ⚠️ ¡ADVERTENCIA! Cambie el token predeterminado antes de usar en producción.
// ⚠️ 警告：デフォルトのトークンを本番環境で使用する前に変更してください。
// ⚠️ 경고: 배포 전에 기본 토큰을 변경하세요!
// ⚠️ WARNUNG: Ändern Sie das Standard-Token vor dem Einsatz!
// ⚠️ AVERTISSEMENT : Modifiez le jeton par défaut avant le déploiement !
// ⚠️ تحذير: غيّر رمز الوصول الافتراضي قبل النشر!
const APP_TOKEN = "DAGEPartyAuth20250520ReadCode";

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export default {
  async fetch(request, env) {
    if (request.method !== "GET") {
      return jsonResponse({ code: -101, message: "Forbidden" }, 403);
    }

    const authHeader = request.headers.get("Authorization");
    if (authHeader !== `Bearer ${APP_TOKEN}`) {
      return jsonResponse({ code: -100, message: "Unauthorized" }, 403);
    }

    const url = new URL(request.url);
    const path = url.pathname.split("/");

    if (path.length < 2) {
      return jsonResponse({ code: -1001, message: "Forbidden" }, 403);
    }

    if (path.length === 2 || (path.length === 3 && path[2] === "")) {
      if (path[1] === "__tables") {
        return await handleListTables(env.DB);
      }
      return jsonResponse({ code: -1006, message: "Forbidden" }, 403);
    }

    const [ , tablename, command, param1, param2 ] = path;

    switch (command) {
      case "__maxid":
        return await handleGetMaxId(env.DB, tablename);
      case "id":
        const id = parseInt(param1, 10);
        if (isNaN(id)) {
          return jsonResponse({ code: -106, message: "Invalid ID format." }, 400);
        }
        return handleGet(env.DB, tablename, id);
      case "c1":
        return await handleGetByC1(env.DB, tablename, param1);
      case "c2":
        return await handleGetByC2(env.DB, tablename, param1);
      case "c1c2":
        return await handleGetByC1C2(env.DB, tablename, param1, param2);
      case "list":
        return await handleList(env.DB, tablename);
      case "idlimitlist":
        return await handleIDLimitList(env.DB, tablename, param1, param2);
      default:
        return jsonResponse({ code: -1002, message: "Forbidden" }, 403);
    }
  }
};

async function handleGet(db, tablename, id) {
  try {
    const query = `SELECT id, c1, c2, i1, i2, d1, d2, t1, t2, v1, v2 FROM ${tablename} WHERE id = ?;`;
    const result = await db.prepare(query).bind(id).first();

    if (!result) {
      return jsonResponse({ code: -104, message: "Log not found." }, 404);
    }

    return jsonResponse({ code: 0, message: "OK", data: result });
  } catch (error) {
    return jsonResponse({ code: -108, message: `Error retrieving log: ${error.message}` }, 500);
  }
}

async function handleGetByC1(db, tablename, c1) {
  try {
    const query = `SELECT id, c1, c2, i1, i2, d1, d2, t1, t2, v1, v2 FROM ${tablename} WHERE c1 = ?;`;
    const result = await db.prepare(query).bind(c1).first();

    if (!result) {
      return jsonResponse({ code: -104, message: "Log not found." }, 404);
    }

    return jsonResponse({ code: 0, message: "OK", data: result });
  } catch (error) {
    return jsonResponse({ code: -108, message: `Error retrieving log: ${error.message}` }, 500);
  }
}

async function handleGetByC2(db, tablename, c2) {
  try {
    const query = `SELECT id, c1, c2, i1, i2, d1, d2, t1, t2, v1, v2 FROM ${tablename} WHERE c2 = ?;`;
    const result = await db.prepare(query).bind(c2).first();

    if (!result) {
      return jsonResponse({ code: -104, message: "Log not found." }, 404);
    }

    return jsonResponse({ code: 0, message: "OK", data: result });
  } catch (error) {
    return jsonResponse({ code: -108, message: `Error retrieving log: ${error.message}` }, 500);
  }
}

async function handleGetByC1C2(db, tablename, c1, c2) {
  try {
    const query = `SELECT id, c1, c2, i1, i2, d1, d2, t1, t2, v1, v2 FROM ${tablename} WHERE c1 = ? AND c2 = ?;`;
    const result = await db.prepare(query).bind(c1, c2).first();

    if (!result) {
      return jsonResponse({ code: -104, message: "Log not found." }, 404);
    }

    return jsonResponse({ code: 0, message: "OK", data: result });
  } catch (error) {
    return jsonResponse({ code: -108, message: `Error retrieving log: ${error.message}` }, 500);
  }
}

async function handleListTables(db) {
  try {
    const { results } = await db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table';"
    ).all();

    return jsonResponse({ code: 0, message: "OK", data: results });
  } catch (error) {
    return jsonResponse({ code: -110, message: `Error listing tables: ${error.message}` }, 500);
  }
}

async function handleGetMaxId(db, tablename) {
  try {
    const query = `SELECT MAX(id) as max_id FROM ${tablename};`;
    const result = await db.prepare(query).first();

    if (!result || result.max_id === null) {
      return jsonResponse({ code: -105, message: "No logs available." }, 404);
    }

    return jsonResponse({ code: 0, message: "OK", data: result.max_id });
  } catch (error) {
    return jsonResponse({ code: -108, message: `Error retrieving max ID: ${error.message}` }, 500);
  }
}

async function handleList(db, tablename) {
  try {
    const query = `SELECT id, c1, c2, i1, i2, t1, DATETIME(v1, '+8 hours') AS v1 FROM ${tablename};`;
    const result = await db.prepare(query).all();

    if (result.error) {
      return jsonResponse({ code: -111, message: result.error.message }, 500);
    }

    return jsonResponse({ code: 0, message: "OK", data: result.results });
  } catch (error) {
    return jsonResponse({ code: -108, message: `Error querying database: ${error.message}` }, 500);
  }
}

async function handleIDLimitList(db, tablename, idbase, queryCount) {
  try {
    const id1 = parseInt(idbase, 10);
    const count1 = parseInt(queryCount, 10);

    if (isNaN(id1) || isNaN(count1)) {
      return jsonResponse({ code: -146, message: "Invalid ID or count format." }, 400);
    }

    const query = `SELECT id, c1, c2, i1, i2, t1, DATETIME(v1, '+8 hours') AS v1 FROM ${tablename} WHERE id > ? LIMIT ?;`;
    const result = await db.prepare(query).bind(id1, count1).all();

    if (result.error) {
      return jsonResponse({ code: -147, message: result.error.message }, 500);
    }

    return jsonResponse({ code: 0, message: "OK", data: result.results });
  } catch (error) {
    return jsonResponse({ code: -148, message: `Error querying database: ${error.message}` }, 500);
  }
}
