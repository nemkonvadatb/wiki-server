const oracledb = require("oracledb");

module.exports = async (query, params) => {
  try {
    connection = await oracledb.getConnection({
      user: process.env.USER,
      password: process.env.PASSWORD,
      connectString: process.env.CONNECT_STRING,
    });
    const res = await connection.execute(query, params);
    await connection.execute("COMMIT WORK");
    return res;
  } catch (err) {
    console.error(err.message);
  } finally {
    if (connection) {
      try {
        await connection.close(); // Always close connections
      } catch (err) {
        console.error(err.message);
      }
    }
  }
};
