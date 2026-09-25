const {
  getAllUsers,
  getUserByIdAdmin,
} = require("../models/adminUserModel");
const {getCache, setCache} = require('../utils/cache');


// =====================================================
// GET ALL USERS
// =====================================================

const getAdminUsers = async (req, res) => {

  try {
    //check redis cache memory
    const cachedUsers = await getCache('users');
    
    if(cachedUsers){
      console.log('Users fetched from redis cache memory')
      return res.json(cachedUsers);
    }
    
    //redis miss
    console.log('cache miss fetched from sql server')
    const users = await getAllUsers();

    //store in redis cache memory
    await setCache(
      "users",
      users,
      300
    )
    
    return res.status(200).json({
      success: true,
      count: users.length,
      users,
    });

  } catch (error) {

    console.error(
      "Get admin users error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to fetch users",
    });

  }
};


// =====================================================
// GET SINGLE USER
// =====================================================

const getAdminUserById = async (req, res) => {

  try {

    const userId = Number(req.params.id);

    if (!Number.isInteger(userId) || userId <= 0) {

      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });

    }


    const user =
      await getUserByIdAdmin(userId);


    if (!user) {

      return res.status(404).json({
        success: false,
        message: "User not found",
      });

    }


    return res.status(200).json({
      success: true,
      user,
    });

  } catch (error) {

    console.error(
      "Get admin user error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to fetch user",
    });

  }
};


module.exports = {
  getAdminUsers,
  getAdminUserById,
};