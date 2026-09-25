const {createClient} = require('redis');

const redisClient = createClient(
    {
        url: process.env.REDIS_URI,
    }
)

redisClient.on("error", (err)=>{
    console.log('Redis error:', err);
})

redisClient.on("connect", ()=>{
    console.log("Redis connecting...")
})

redisClient.on("ready", ()=>{
    console.log("Redis connected successfully")
})

redisClient.on("reconnect", ()=>{
    console.log("Redis reconnecting...")
})

const connectRedis = async ()=>{
    if(!redisClient.isOpen){
        await redisClient.connect();
    }
}

module.exports = {redisClient, connectRedis};