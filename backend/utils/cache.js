const {
  redisClient,
  connectRedis,
} = require("../config/redis");


// =====================================================
// GET CACHE
// =====================================================

const getCache = async (key) => {

  try {

    // Make sure Redis is connected
    await connectRedis();

    const data = await redisClient.get(key);

    if (!data) {
      return null;
    }

    return JSON.parse(data);

  } catch (error) {

    console.error("Redis get error:", error);

    return null;
  }
};


// =====================================================
// SET CACHE
// =====================================================

const setCache = async (
  key,
  data,
  expiry = 60
) => {

  try {

    // Make sure Redis is connected
    await connectRedis();

    await redisClient.set(
      key,
      JSON.stringify(data),
      {
        EX: expiry,
      }
    );

  } catch (error) {

    console.error("Redis set error:", error);
  }
};


// =====================================================
// DELETE CACHE
// =====================================================

const deleteCache = async (key) => {

  try {

    // Make sure Redis is connected
    await connectRedis();

    await redisClient.del(key);

  } catch (error) {

    console.error("Redis delete error:", error);
  }
};


module.exports = {
  getCache,
  setCache,
  deleteCache,
};