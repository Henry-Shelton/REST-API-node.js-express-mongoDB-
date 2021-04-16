# REST-API-node.js-express-mongoDB-
Allows users to input data (after user authentication) which undergoes geolocation onto an embedable map, data can be viewed and edited form table, bcrypt and unique user IDs prevent inteference when extracting from mongoDB. 

main app = app.js (additional modules and middleware due to rest of app not being included here) 

API/DB pipeline in order of: 
addstore.ejs (mongoose schema to mongoDB), 
store.js (creates and geocodes schema into DB), 
db.js (connects DB to App), 
widget.js (allowes individual user DB data to be visualised). 

Controllers and routes are for data flow and management (controllers define get, post, put, delete actions and routes to DB/API). 
Viewstores.ejs, previewstores.ejs and updatestore.ejs all for user front-end input, viewing and editing.

!!!!!!!!!
For full app access (login system / bcrypt security / passport strategy / stripe payment processing / webhooks / authentication + mail system / .env secrets / all webpages + backend BD and cloud web hosting info) message me.
!!!!!!!!!
