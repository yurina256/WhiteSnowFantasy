var pw = require("./pw.js");

//express
var express = require("express");
var app = express();
const fs = require('fs');
const port = 443;

app.use(express.json());
app.use(express.urlencoded({
    extended: true
}));

//サーバ立ち上げ
const server = require('https').createServer({
  //証明書
  key: fs.readFileSync(pw.key_path),
  cert: fs.readFileSync(pw.cert_path),  
}, app);

//Line関連
const line = require('@line/bot-sdk');
const crypto = require('crypto');

const config = {
    channelAccessToken: pw.line_channelAccessToken,
    channelSecret: pw.line_channelSecret
}

const client = new line.Client(config);

//MySQL
const mysql = require('mysql');
const connection = mysql.createConnection({
  host: 'database-1.c0gwlsggxfl3.ap-northeast-1.rds.amazonaws.com',
  user: 'admin',
  password: pw.db_pw,
});
connection.query(`use toinfes`);

function sign_check(req,res){
  const signature = crypto.createHmac("SHA256", config['channelSecret']).update(JSON.stringify(req.body)).digest("base64");
  const checkHeader = req.headers['x-line-signature'];
  console.log(checkHeader);
  if(signature !== checkHeader){
    console.log("sign check error");
    res.sendStatus(401);
  }
  else console.log('sign check succees');
}

app.get("/",(req,res,next) => {
  console.log("request : get -> /");
  res.sendStatus(200);
});

app.post("/api",(req,res) => {

  //署名検証
  sign_check(req,res);

  console.log(req.body.events[0].source);

});

//status check
app.get("/api",(req,res) => {
  //DB
  connection.connect((err) => {
    if (err) {
      console.log('error connecting: ' + err.stack);
      res.send('DB : ' + err.stack);
      return;
    }
      console.log('success');
      res.send('DB : success');
    });
});

//
app.get("/api/user/:userId",(req,res) => {
  connection.query(`SELECT * FROM users where userId = '${req.params["userId"]};'`,(error, results) => {
      console.log(results[0]);
      res.json(results[0]);
    }
  );
});

app.get("/api/user-all",(req,res) => {
  connection.query(`SELECT * FROM users;`,(error, results) => {
      console.log(results);
      res.json(results);
    }
  );
});

//Lambdaではここが叩かれる
exports.handler = (event,context) => {
    
    //DB接続
    /*
    connection.connect((err) => {
  if (err) {
    console.log('error connecting: ' + err.stack);
    return;
  }
    console.log('success');
  });
  */
    console.log(req.body.events[0].replyToken);
    client.replyMessage(req.body.events[0].replyToken, {type:'text',text:'hoge'})
                    .then((response) => {
                        let lambdaResponse = {
                            statusCode: 200,
                            headers: { "X-Line-Status": "OK" },
                            body: '{"result":"completed"}'
                        };
                        context.succeed(lambdaResponse);
                    }).catch((err) => console.log(err));
}

server.listen(port, () => console.log(`LListen : port ${port}!`));