const {redisClient} = require('../config/redis');

const getCache = async (key)=>{
    try {
        const data = await redisClient.get(key);
        if(!data){
            return null;
        }
        return JSON.parse(data);
    } catch (error) {
        console.log("Redis error", error)
        return null;
    }
}

const setCache = async (key, data, expiry = 60) =>{
    try {
        await redisClient.set(
            key,
            JSON.stringify(data),
            {
                EX: expiry
            }
        )
    } catch (error) {
        console.error("Redis set error", error);
    }
}

const deleteCache = async (key)=>{
    try {
        await redisClient.del(key);
    } catch (error) {
        console.error("Redis delete error", error);
    }
}

module.exports = {getCache, setCache, deleteCache};