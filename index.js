const express = require('express')
const app = express()
const bodyParser = require('body-parser');
const path = require('path')


const port = process.env.PORT || 4040



app.use(
    "/",
    express.static(path.join(__dirname, "www"), {
        fallthrough: false
    })
);


app.listen(port, () => {
    console.log(`metro boomin  @ ${port}`);
})


module.exports = app