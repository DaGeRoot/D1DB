/*
  Dage Party D1DB(cloudfalre workers)
*/


// ⚠️ WARNING: CHANGE THE DEFAULT TOKEN BEFORE DEPLOYMENT! ⚠️
// ⚠️ 警告：请在部署前更改默认令牌！
// ⚠️ ¡ADVERTENCIA! Cambie el token predeterminado antes de usar en producción.
// ⚠️ 警告：デフォルトのトークンを本番環境で使用する前に変更してください。
// ⚠️ 경고: 배포 전에 기본 토큰을 변경하세요!
// ⚠️ WARNUNG: Ändern Sie das Standard-Token vor dem Einsatz!
// ⚠️ AVERTISSEMENT : Modifiez le jeton par défaut avant le déploiement !
// ⚠️ تحذير: غيّر رمز الوصول الافتراضي قبل النشر!
const APP_TOKEN = "DAGEPartyAuth20250520WriteCode";


export default {
  async fetch(request, env) {
    const authHeader = request.headers.get("Authorization");

    if (authHeader !== `Bearer ${APP_TOKEN}`) {
      return jsonResponse(403, -1004, "Unauthorized");
    }

    const url = new URL(request.url);
    const path = url.pathname.split('/');

    if (path.length < 3) {
      if (path[1] === "__tables") {
        return await handleListTables(env.DB);
      }
      return jsonResponse(403, -1003, "Forbidden");
    }

    try {
      if (request.method === "POST") {
        if (path[2] === '__init') {
          return initDatabase(env.DB, path[1]);
        } else {
          // tablename, id(0:system increase), c1,c2,c3,i1..... body as t1;
          return handlePost(
            env.DB, path[1], path[2], path[3], path[4], path[5], path[6], path[7], path[8], path[9], path[10], path[11], await request.text()
          );
        }
      } else if (request.method === "PUT") {
        if (path[2] === "id") {
          return handlePutID(env.DB, path[1], path[3], await request.text());
        } else if (path[2] === "c1") {
          return handlePutC1(env.DB, path[1], path[3], await request.text());
        } else if (path[2] === "c1c2") {
          return handlePutC1C2(env.DB, path[1], path[3], path[4], await request.text());
        }
      } else if (request.method === "DELETE") {
        if (path[2] === "id") {
          return handleDeleteID(env.DB, path[1], path[3]);
        } else if (path[2] === "c1") {
          return handleDeleteC1(env.DB, path[1], path[3]);
        }
      }

      return jsonResponse(403, -1001, "Forbidden");
    } catch (e) {
      return jsonResponse(500, -109, `Unhandled server error: ${e.message}`);
    }
  }
};

function jsonResponse(status = 200, code = 0, message = "", data = null) {
  const body = { code, message };
  if (data !== null) body.data = data;
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function initDatabase(db, tablename) {
  try {
    const query1 = `CREATE TABLE IF NOT EXISTS ${tablename} (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      c1 VARCHAR(255),
      c2 VARCHAR(255),
      c3 VARCHAR(255),
      i1 INT,
      i2 INT,
      i3 INT,
      d1 DOUBLE,
      d2 DOUBLE,
      d3 DOUBLE,
      t1 TEXT,
      t2 TEXT,
      t3 TEXT,
      v1 TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      v2 TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      v3 TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );`;
    await db.prepare(query1).run();

    const query2 = `CREATE INDEX IF NOT EXISTS idx_${tablename}_c1 ON ${tablename}(c1);`;
    await db.prepare(query2).run();

    const query3 = `INSERT INTO ${tablename} (id, c1, c2, i1, d1) VALUES (1, "1", "dageParty basic DB version", 1, 1); 
                    INSERT INTO ${tablename} (id, c1) VALUES (100, "systemReserve");`;
    await db.prepare(query3).run();

    return jsonResponse(200, 0, "Database initialized successfully.");
  } catch (error) {
    return jsonResponse(500, -102, `Error initializing database: ${error.message}`);
  }
}

async function handlePost(db, tablename, idPart, c1, c2, c3, i1, i2, i3, d1, d2, d3, body) {
  try {
    const iID = parseInt(idPart, 10) || 0;
    const t1 = body;

    const params = [
      c1 || null,
      c2 || null,
      c3 || null,
      i1 ? parseInt(i1) : null,
      i2 ? parseInt(i2) : null,
      i3 ? parseInt(i3) : null,
      d1 ? parseFloat(d1) : null,
      d2 ? parseFloat(d2) : null,
      d3 ? parseFloat(d3) : null,
      t1 || null,
    ];

    if (iID > 0) {
      const query = `INSERT INTO ${tablename} 
        (id, c1, c2, c3, i1, i2, i3, d1, d2, d3, t1) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`;
      await db.prepare(query).bind(iID, ...params).run();
      return jsonResponse(200, 0, "Inserted with ID", { id: iID });
    } else {
      const query = `INSERT INTO ${tablename} 
        (c1, c2, c3, i1, i2, i3, d1, d2, d3, t1) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`;
      const result = await db.prepare(query).bind(...params).run();
      return jsonResponse(200, 0, "Inserted with auto ID", { id: result.meta.last_row_id });
    }
  } catch (error) {
    if (error.message.includes("UNIQUE constraint")) {
      return jsonResponse(409, -107, "Key already exists.");
    }
    return jsonResponse(500, -108, `Error adding value: ${error.message}`);
  }
}

// update t1 by id;
async function handlePutID(db, tablename, idPart, body) {
  try {
    const id = parseInt(idPart, 10);
    if (isNaN(id)) return jsonResponse(400, -106, "Invalid ID format");

    const query = `UPDATE ${tablename} SET t1 = ?, v2 = CURRENT_TIMESTAMP WHERE id = ?;`;
    await db.prepare(query).bind(body, id).run();

    return jsonResponse(200, 0, "Updated by ID", { id });
  } catch (error) {
    return jsonResponse(500, -108, `Error update by ID: ${error.message}`);
  }
}

// update t1 by c1;
async function handlePutC1(db, tablename, c1, body) {
  try {
    const query = `UPDATE ${tablename} SET t1 = ?, v2 = CURRENT_TIMESTAMP WHERE c1 = ?;`;
    await db.prepare(query).bind(body, c1).run();

    return jsonResponse(200, 0, "Updated by c1", { c1 });
  } catch (error) {
    return jsonResponse(500, -108, `Error update by c1: ${error.message}`);
  }
}

// update t1 by c1 and c2;
async function handlePutC1C2(db, tablename, c1, c2, body) {
  try {
    const query = `UPDATE ${tablename} SET t1 = ?, v2 = CURRENT_TIMESTAMP WHERE c1 = ? AND c2 = ?;`;
    await db.prepare(query).bind(body, c1, c2).run();

    return jsonResponse(200, 0, "Updated by c1 and c2", { c1, c2 });
  } catch (error) {
    return jsonResponse(500, -108, `Error update by c1/c2: ${error.message}`);
  }
}

async function handleDeleteC1(db, tablename, c1) {
  try {
    const query = `UPDATE ${tablename} SET i1=1001 WHERE c1 = ?;`;
    await db.prepare(query).bind(c1).run();

    return jsonResponse(200, 0, "Deleted (marked) by c1", { c1 });
  } catch (error) {
    return jsonResponse(500, -108, `Error delete by c1: ${error.message}`);
  }
}

async function handleDeleteID(db, tablename, id) {
  try {
    const query = `UPDATE ${tablename} SET i1=1001 WHERE id = ?;`;
    await db.prepare(query).bind(id).run();

    return jsonResponse(200, 0, "Deleted (marked) by id", { id });
  } catch (error) {
    return jsonResponse(500, -108, `Error delete by id: ${error.message}`);
  }
}

async function handleListTables(db) {
  try {
    const { results } = await db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table';"
    ).all();

    return jsonResponse(200, 0, "Tables fetched", results);
  } catch (error) {
    return jsonResponse(500, -110, `Error fetching tables: ${error.message}`);
  }
}
