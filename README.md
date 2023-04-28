# Blue-Birdie
A small social media to make post to your followers.



# How to install:
1. Using terminal clone this repo by this command:
````
git clone https://github.com/ritish78/Blue-Birdie.git
````
2. Once the files is in your system, open it with your IDE.
3. Then, you need the build the dependencies
````
npm install
````
4. Then you can use either `Nodemon` or `npm` to start the server.
````
npm app.js

OR

nodemon app.js
````
5. Node will start the server on port `5000`. If you have other services running on port `5000`, you can change it in `app.js` file.


# Usage:
* Go to `http://localhost:5000` or `http://127.0.0.1:5000`.
* It will ask you to sign in. You need to create an account before signing in.
* Passwords are encrypted using `bcrypt`.
* Currently you are the only user, so you can create other users as well.
* Then you can follow other users.
* You can only see the posts from other users which you have followed.
* The posts on your timeline are populated after you have followed someone. Their previous posts are not populated.


# Tech stack used:
* Database - Redis
* Frontend - Pug with Tailwind CSS
* Backend - Node.js with express

`SessionID` is generated from `express-session` and are stored as cache in Redis. It is set to be valid for 2 days. 

