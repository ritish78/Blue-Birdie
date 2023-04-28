const express = require("express");
const path = require("path");
const redis = require("redis");
const bcrypt = require("bcrypt");
const session = require("express-session");
const RedisStore = require("connect-redis");
const { promisify } = require("util");
const { formatDistance } = require("date-fns");
const dotenv = require("dotenv");
const bodyParser = require("body-parser");
const app = express();
const redisClient = redis.createClient({
  host: "localhost",
  port: 6379,
});
redisClient.connect();
dotenv.config();

const redisStore = new RedisStore.default({
  client: redisClient,
});


const EXPRESS_SERVER_PORT = 5000;

app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));

//configure middleware
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: false }));
app.use(
  session({
    store: redisStore,
    //store: new RedisStore({ RedisStoreOptions: redisClient }),
    resave: true,
    saveUninitialized: true,
    cookie: {
      maxAge: 172800000, // 2 days
      httpOnly: false,
      secure: false     //Its false because if not set to false, it does not work on localhost
    },
    secret: "iaosndmo231msdmas9amxca",
  })
)


//Promisify functions
const asMembers = promisify(redisClient.hGet).bind(redisClient);
const ahGet = promisify(redisClient.hGet).bind(redisClient);
const ahKeys = promisify(redisClient.hKeys).bind(redisClient);
const akeys = promisify(redisClient.keys).bind(redisClient);
const aincr = promisify(redisClient.incr).bind(redisClient);
const alRange = promisify(redisClient.lRange).bind(redisClient);
const alPush  = promisify(redisClient.lPush).bind(redisClient);







app.get("/", (req, res) => {
  if (req.session.userid) {
    
    const currentUsername = req.session.username;

    console.log('Printing timeline for user: ', req.session.username);
    
      getTimeLineForCurrentUser(currentUsername).then((timelines) => {
        console.log(timelines.length);
        res.render('dashboard', {
          username: req.session.username,
          timeline: timelines
        });
      })
    
  } else {
    res.redirect("/signin");
}})




app.get("/signin", (req, res) => {
  if (req.session.userid) {
    res.redirect('/');
  } else {
    res.render("signin");
  }
});

app.get("/login", (req, res) => {
  res.redirect("/signin");
})

app.get("/follow", (req, res) => {
  if (req.session.userid) {
    getUsersToFollowForCurrentUser(req.session.username)
      .then((usersToFollow) => {
        console.log(usersToFollow);
        res.render("followPeople", {
          username: req.session.username,
          users: usersToFollow
        })
      })
  } else {
    res.render("signin");
  }
})

app.post("/signin", (req, res) => {
  const { username, password } = req.body;

  //First, checking if the username and password fields are not empty
  if (!username || !password) {
    res.renderer("error", {
      message: "Please set both username and password!",
      link: "/signin",
    });
  }

  checkExistsUsernameAndEmail(username, username).then((userExists) => {
    if (!userExists) {
      res.render("error", {
        message: "User does not exists!",
      });
    } else {
      //User exists, so we need to check the password
      handleSignIn(username, password, req, res);
    }
  });

  console.log(req.body, username, password);
});


app.get("/signup", (req, res) => {
  if (req.session.userid) {
    res.redirect('/');
  } else {
    res.render("signup");
  }
});


app.post("/signup", (req, res) => {
  const { username, email, password, confirmPassword } = req.body;

  console.log(username, email, password, confirmPassword);

  if (password !== confirmPassword) {
    res.render("error", {
      message: "Passwords are not same!",
      link: "/signup",
    });
    res.redirect("/signup");
  }

  console.log("Passwords match!");

  //Now calling function which handles the signup process
  handleSignup(username, email, password, res);

});


app.get('/post', (req, res) => {
  if (req.session.userid) {
    // res.render("post");
    res.redirect('/');
  } else {
    res.redirect("/signin");
  }
})



app.post('/post', (req, res) => {
  if (!req.session.userid) {
    res.render("signin");
    return;
  } else {
    //Getting the message from the request bodu
    const { message } = req.body;


    //Calling the function which handles adding posts to the database
    handlePostMessage(req.session.userid, req.session.username, message)
        .then((postId) => {
          console.log('\n\n\nPost Id:', postId);
        })
  
    //It is better to redirect to dashboard instead of rendering dashboard
    //If we render to dashboard url will still be '/post' and if the user refreshes
    //the page, the post is saved again in database.

    res.redirect('/');
  }
});




app.post("/follow", (req, res) => {
  if (!req.session.userid) {
    res.redirect('/signin');
    return;
  }

  //First, we get the user that the current user wants to follow
  //It is saved in the req body
  const { username } = req.body;
  const currentUsername = req.session.username;

  console.log(`${currentUsername} wants to follow ${username}`);


  redisClient.sAdd(`following:${currentUsername}`, username)
              .then(redisClient.sAdd(`followers:${username}`, currentUsername)
                                .then(res.redirect('/')))
                                .catch(err => {
                                  console.log('Error in following user!', err);
                                  res.status(500).send('Error following user.');
                                });

  console.log(`${currentUsername} is now following ${username}`);

});


app.post("/like", (req, res) => {
  const { postId, isLike } = req.body;

  console.log('POST ID:', postId);
  console.log('IS LIKED?', isLike);
  // console.log('Req body:', req);
  // console.log('Res body:', res);

  // Now we can increase the like counter in redis
  handlePostLikeByUser(postId, req)
        .then(res.send({ message: 'Post Liked!' }))
  
  
})

async function handlePostLikeByUser(postId, req) {
  const currentUsername = req.session.username;

  //Increasing the like counter in Redis
  const detailsAboutPost = await redisClient.hGetAll(`post:${postId}`);

  
  console.log('post post post id', postId);
  console.log(detailsAboutPost);
  
}



async function handlePostMessage (userId, currentUsername, message) {
  const postId = await redisClient.incr('postId');
  const addPostToRedis = await redisClient.hSet(`post:${postId}`, 
                        {'postId': postId,
                          'userId': userId,
                          'username': currentUsername,
                          'message': message,
                          'likes': 1,           //When a user posts, likes starts from 1.
                          'timestamp': Date.now()});
 

  //First we get the followers of the current user.
  const followersOfCurrentUser = await getFollowersOfUser(currentUsername);

  console.log(`Followers of ${currentUsername} are: `, followersOfCurrentUser);

  for (const user of followersOfCurrentUser) {
    await redisClient.sAdd(`timeline:${user}`, postId.toString());
  }

  return postId;
}



async function getTimeLineForCurrentUser(username) {
  const timeline = [];
  const postsId = await redisClient.sMembers(`timeline:${username}`);

  console.log('\n\n\n\n POSTSID:', postsId);

  for (const post of postsId) {
    const postKeys = await redisClient.hGetAll(`post:${post}`);

    const timestamp = postKeys.timestamp;
    const timeString = formatDistance(new Date(), new Date(parseInt(parseInt(timestamp))));
     
    const likes = postKeys.likes;

    console.log('Number of likes:', likes);
    console.log('PostID in timeline:', parseInt(postKeys.postId));
    timeline.push({
      postId: parseInt(postKeys.postId),
      message: await redisClient.hGet(`post:${post}`, 'message'),
      author: await redisClient.hGet(`post:${post}`, 'username'),
      likes: likes,
      timeString: timeString,
      isLiked: "false"      
    });
    
  }
  console.log(`TIMELINE FOR CURRENT USER: `, timeline);
   return timeline;
}



// async function getFiveUsersToFollow (currentUserId) {
//   redisClient.userKeys('users:*').then((allUsers) => {
//     console.log('\n\nAll Users: ', allUsers);
//     return allUsers;
//   })
//   return [];
// }



// const userKeys = [];
// function getFiveUsersToFollow(userId, cursor = 0) {
//   redisClient.scan(cursor, 'MATCH', 'users*', 'COUNT', '6')
//     .then((results) => {
//       const [newCursor, scanResult] = results;
//       userKeys.push(...scanResult);

//       if(newCursor === '0') {
//         // We've iterated over all the userKeys that match the pattern
//       // Now we can retrieve the values for those userKeys
//       client.mget(userKeys, (err, values) => {
//         if (err) {
//           throw err;
//         }
//         const users = values.map((value) => JSON.parse(value));
//         console.log('All users:', users);
//       });
//     } else {
//       // There are more userKeys to iterate over
//       getFiveUsersToFollow(userId, newCursor);
//       }

//     })
// }



const handleSignup = (username, email, password, res) => {
  checkExistsUsernameAndEmail(username, email).then((userExists) => {
    if (userExists) {
      res.render("error", {
        message: "User already exists!",
        link: "/signin",
      });
    } else {
      //Now, getting a hashed password from salt as we don't store plain password
      getHashedPasswordFromSalt(password).then((hashedPassword) => {
        //Calling function which adds user to the database
        addUserToRedisWithUsernameEmail(username, email, hashedPassword).then(
          res.redirect("/signin")
        );
      });
    }
  });
}


const handleSignIn = (username, password, req, res) => {
      //First, we hash the password against the salt.
      //Then, we compare if the hashed value is same as
      //the value that we have in our database
      //compareTextWithHashedPassword(password, savedPasswordInOurDB)

      getUserIdFromUsername(username).then((userId) => {
        if (!userId) res.end();
        getAllUserDetailsOfUser(userId).then((allDetails) => {
          const passwordFromRedis = allDetails.password;

          compareTextWithHashedPassword(password, passwordFromRedis).then(
            (passwordsMatch) => {
              console.log('\nPassword from user and redis match? : ', passwordsMatch)
              if (!passwordsMatch) {
                res.render("error", {
                  message: "Wrong username or password!",
                });
              } else {
                //User has finally verified all checks
                //Now, we can create a session
                saveSessionAndRenderDashboard(userId, username, req, res);
              }
            }
          );
        });
      });
}


async function getUsersToFollowForCurrentUser(currentUsername) {
    //We want to display those users which we haven't followed.
    //First, we get all users from Redis, then we get the followers
    //list of the current user. Then we filter allusers to get
    //only the users which we haven't followed and are not the current user.
    const allUsers = await getAllUsersFromRedis();
    const followings = await getFollowingsOfUser(currentUsername);

    const filteredUsers = allUsers.filter((user) => {
      return user.username !== currentUsername && followings.indexOf(user.username) === -1
    });

    return filteredUsers;

}


async function saveSessionAndRenderDashboard(userId, username, req, res) {
  //This function is responsible for storing userId into session
  //We can add few more fields so when we signin we can do more checks
  req.session.userid = userId;
  req.session.username = username;
  req.session.save();
  

  res.redirect('/');
}



async function getAllUsersFromRedis() {
  const userKeys = await redisClient.keys('users*');
  const allUsers = await Promise.all(userKeys.map(async (key) => {
     return await redisClient.hGetAll(key);
  }));
  
  return allUsers;
}

async function getFollowingsOfUser(username) {
  const followings = await redisClient.sMembers(`following:${username}`);

  console.log('\n\nFollowings: ', followings);

  return followings;
}

async function getFollowersOfUser(username) {
  const followers  = await redisClient.sMembers(`followers:${username}`);

  console.log('\n\nFollowes: ', followers);

  return followers;
}


async function addUserToRedisWithUsernameEmail(username, email, password) {
  const newUserId = await redisClient.incr("userId");
  console.log("New user of id: ", newUserId);

  await redisClient.sAdd("usernames", username);
  await redisClient.sAdd("email", email);
  await redisClient.hSet(`userName:${newUserId}`, { username: username });
  await redisClient.hSet(`userEmail:${newUserId}`, { email: email });
  await redisClient.hSet(`users:${newUserId}`, {
    userId: newUserId,
    username: username,
    email: email,
    password: password,
  });
}

async function checkExistsUsernameAndEmail(username, email) {
  console.log("Started checking Username and email for", username, email);

  // Username is stored as userName:{userId} userName
  const userExists = await redisClient.sIsMember("usernames", username);
  const emailExists = await redisClient.sIsMember("email", email);

  console.log(userExists, emailExists);

  TODO:
  //Implement signin using email as well.
  //if (userExists || emailExists)
  //We need to change handleSignIn function to make it accept email

  if (userExists) {
    return true;
  } else {
    return false;
  }
}

async function getUserIdFromUsername(username) {
  const allUserKeys = await redisClient.keys("users:*");

  for (const key of allUserKeys) {
    const userDetails = await redisClient.hGetAll(key);

    if (username === userDetails.username) {
      console.log(`User id of ${username} is ${userDetails.userId}`);
      return userDetails.userId;
    }
  }

  return null;
}

async function getAllUserDetailsOfUser(userId) {
  //We get all the details from hGetAll method
  const allDetails = await redisClient.hGetAll(`users:${userId}`);


  return allDetails;
}

//This function is used only when testing the app.
async function deleteUsernameAndEmail() {
  const allUsername = await redisClient.userKeys("userName:*");
  const allEmail = await redisClient.userKeys("userEmail:*");
  const allUsers = await redisClient.userKeys("users:*");
  const allPosts = await redisClient.userKeys("post:*");

  for (const username of allUsername) {
    redisClient.del(username);
  }
  for (const email of allEmail) {
    redisClient.del(email);
  }
  for (const user of allUsers) {
    redisClient.del(user);
  }
  for (const post of allPosts) {
    redisClient.del(post);
  }
}

async function getHashedPasswordFromSalt(passwordFromUser) {
  console.log("Password from user: ", passwordFromUser);
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(passwordFromUser, saltRounds);

  console.log("Hashed password: ", hashedPassword);
  return hashedPassword;
}

async function compareTextWithHashedPassword(
  passwordFromUser,
  hashedPasswordFromRedis
) {
  console.log('Checking password: ', passwordFromUser, hashedPasswordFromRedis)
  const isHashesOfPasswordSame = await bcrypt.compare(
    passwordFromUser,
    hashedPasswordFromRedis
  );
  //If passwordFromUser is hashed and we get the same hashed value,
  //the password from user is correct and we return true if so.
  //If the hashed result does not match, we return false.
  return isHashesOfPasswordSame;
}

//This 'error' url is just for testing error page.
app.get("/error", (req, res) => {
  res.render("error", {
    message: "Unkown error occured! Please try again later!",
  });
});

app.post("/signout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.log(err);
    } else {
      //Redirecting to signin page
      res.redirect('/signin');
    }
  });
})

app.listen(EXPRESS_SERVER_PORT, () =>
  console.log("Server ready on port: ", EXPRESS_SERVER_PORT)
);
