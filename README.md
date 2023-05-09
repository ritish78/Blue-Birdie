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
4. You then need to start the redis server.
````
sudo service redis-server start
````
5. Then you can use either `Nodemon` or `npm` to start the server.
````
node app.js

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

# Screenshots
* Going to `http://localhost:5000`

![Login Page](https://user-images.githubusercontent.com/36816476/235047564-8c547e04-6f3a-4615-bd02-af67833762a3.png)
* If we haven't created an account, we can sign up instead.

![Signing up new user](https://user-images.githubusercontent.com/36816476/235047654-14edd0be-e97d-4563-9510-cb4e57cd4653.png)
* Loggin in using the submitted credential, we get this homepage.

![Home Page of new user](https://user-images.githubusercontent.com/36816476/235047742-6348e4a9-7500-4782-bd9c-74c7c88a5cba.png)
* SessionID is created with correct credential.

![SessionID for the current user in the server](https://user-images.githubusercontent.com/36816476/235047971-8a4383a6-a66c-4927-820e-9eab5d16123a.png)
* If the supplied `password` is incorrect.

![Wrong password](https://user-images.githubusercontent.com/36816476/235048253-0bdfb23a-f4fb-46ec-8b4c-38eb8a7c2aa2.png)
* Going to `/follow` endpoint

![Going to follow endpoint](https://user-images.githubusercontent.com/36816476/235047789-ed066d22-1404-4f47-8a86-0ac74a4dc8b5.png)
* Clicking on `Follow` of some users

![Following some users](https://user-images.githubusercontent.com/36816476/235047868-c4a7f1ed-bc87-495a-86d0-8162c4f1cd56.png)
* If the user that we follow, posts after we have followed them, it gets populated in our timeline.

![You can see your posts of users that you follow](https://user-images.githubusercontent.com/36816476/235048325-965a4747-b4b8-4c3d-a79e-a19a0a20b34a.png)
